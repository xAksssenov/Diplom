from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from notifications.models import Notification
from users.permissions import IsModeratorOrAdminRole

from .models import Complaint, Favorite, Review
from .serializers import ComplaintSerializer, FavoriteSerializer, ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related("user").all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        if self.action in {"moderate"}:
            return [IsModeratorOrAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        target_type = self.request.query_params.get("target_type")
        target_id = self.request.query_params.get("target_id")
        if target_type in {Review.TargetType.RECIPE, Review.TargetType.MEAL_PLAN}:
            queryset = queryset.filter(target_type=target_type)
        if target_id:
            try:
                queryset = queryset.filter(target_id=int(target_id))
            except (TypeError, ValueError):
                pass
        if self.request.user.is_authenticated:
            return queryset
        return queryset.filter(is_approved=True, is_deleted=False)

    def list(self, request, *args, **kwargs):
        limit_raw = request.query_params.get("limit")
        if limit_raw is None:
            return super().list(request, *args, **kwargs)

        queryset = self.filter_queryset(self.get_queryset())
        try:
            limit = max(1, min(200, int(limit_raw)))
        except (TypeError, ValueError):
            limit = 30
        try:
            offset = max(0, int(request.query_params.get("offset", 0)))
        except (TypeError, ValueError):
            offset = 0

        total = queryset.count()
        items = queryset[offset : offset + limit]
        serializer = self.get_serializer(items, many=True)
        next_offset = offset + limit if offset + limit < total else None
        return Response(
            {
                "count": total,
                "next_offset": next_offset,
                "results": serializer.data,
            }
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        review = self.get_object()
        is_owner = review.user_id == self.request.user.id
        is_admin = self.request.user.is_superuser or getattr(self.request.user.role, "name", "") == "admin"
        if not (is_owner or is_admin):
            raise PermissionDenied("You can edit only your reviews.")
        serializer.save()

    def perform_destroy(self, instance):
        is_owner = instance.user_id == self.request.user.id
        is_admin = self.request.user.is_superuser or getattr(self.request.user.role, "name", "") == "admin"
        if not (is_owner or is_admin):
            raise PermissionDenied("You can delete only your reviews.")
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted", "updated_at"])

    @action(detail=True, methods=["post"])
    def moderate(self, request, pk=None):
        review = self.get_object()
        approved = bool(request.data.get("is_approved", False))
        review.is_approved = approved
        review.save(update_fields=["is_approved", "updated_at"])
        Notification.objects.create(
            user=review.user,
            event_type=Notification.EventType.REVIEW_MODERATION,
            message=f"Review #{review.id} has been {'approved' if approved else 'rejected'}.",
        )
        return Response(ReviewSerializer(review).data)


class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.select_related("user", "resolved_by").all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser or getattr(self.request.user.role, "name", "") in {"moderator", "admin"}:
            return super().get_queryset()
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        complaint = serializer.save(user=self.request.user)
        moderators = type(self.request.user).objects.filter(role__name__in=["moderator", "admin"])
        notifications = [
            Notification(
                user=moderator,
                event_type=Notification.EventType.NEW_COMPLAINT,
                message=f"New complaint #{complaint.id} was created.",
            )
            for moderator in moderators
        ]
        Notification.objects.bulk_create(notifications)

    @action(detail=True, methods=["post"], permission_classes=[IsModeratorOrAdminRole])
    def resolve(self, request, pk=None):
        complaint = self.get_object()
        new_status = request.data.get("status")
        response_text = request.data.get("response", "")
        if new_status not in {Complaint.Status.RESOLVED, Complaint.Status.DISMISSED}:
            return Response({"detail": "Status must be resolved or dismissed."}, status=status.HTTP_400_BAD_REQUEST)

        complaint.status = new_status
        complaint.response = response_text
        complaint.resolved_by = request.user
        complaint.save(update_fields=["status", "response", "resolved_by", "updated_at"])
        Notification.objects.create(
            user=complaint.user,
            event_type=Notification.EventType.COMPLAINT_RESPONSE,
            message=f"Complaint #{complaint.id} updated with status: {new_status}.",
        )
        return Response(ComplaintSerializer(complaint).data)


class FavoriteViewSet(viewsets.ModelViewSet):
    queryset = Favorite.objects.select_related("user").all()
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
