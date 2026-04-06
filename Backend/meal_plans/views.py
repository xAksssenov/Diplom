from django.db.models import Avg, Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from interactions.models import Review
from notifications.models import Notification
from users.permissions import IsModeratorOrAdminRole

from .models import MealPlan, ShoppingList
from .serializers import MealPlanSerializer, ShoppingListSerializer


class MealPlanViewSet(viewsets.ModelViewSet):
    queryset = MealPlan.objects.prefetch_related("items").all()
    serializer_class = MealPlanSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        if self.action in {"moderate"}:
            return [IsModeratorOrAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(is_deleted=False)

        user_id_raw = self.request.query_params.get("user_id")
        if user_id_raw:
            try:
                queryset = queryset.filter(user_id=int(user_id_raw))
            except (TypeError, ValueError):
                pass

        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status=MealPlan.Status.APPROVED)

        if self.request.query_params.get("personalized") == "1" and self.request.user.is_authenticated:
            preference_query = Q()
            favorite_tags = getattr(self.request.user, "favorite_tags", []) or []
            health_features = getattr(self.request.user, "health_features", []) or []
            for value in [*favorite_tags, *health_features]:
                if not value:
                    continue
                preference_query |= Q(items__recipe__tags__name__icontains=value)
                preference_query |= Q(items__recipe__title__icontains=value)
                preference_query |= Q(items__recipe__description__icontains=value)
            if preference_query:
                queryset = queryset.filter(preference_query).distinct()

        plan_types_raw = (self.request.query_params.get("plan_types") or "").strip()
        if plan_types_raw:
            plan_types = [value.strip() for value in plan_types_raw.split(",") if value.strip()]
            queryset = queryset.filter(plan_type__in=plan_types)

        try:
            min_calories = self.request.query_params.get("calories_min")
            if min_calories not in (None, ""):
                queryset = queryset.filter(total_calories__gte=float(min_calories))
        except (TypeError, ValueError):
            pass

        try:
            max_calories = self.request.query_params.get("calories_max")
            if max_calories not in (None, ""):
                queryset = queryset.filter(total_calories__lte=float(max_calories))
        except (TypeError, ValueError):
            pass

        try:
            min_rating_raw = self.request.query_params.get("min_rating")
            if min_rating_raw not in (None, ""):
                min_rating = float(min_rating_raw)
                rated_plan_ids = (
                    Review.objects.filter(target_type=Review.TargetType.MEAL_PLAN, is_deleted=False)
                    .values("target_id")
                    .annotate(avg_rating=Avg("rating"))
                    .filter(avg_rating__gte=min_rating)
                    .values_list("target_id", flat=True)
                )
                queryset = queryset.filter(id__in=rated_plan_ids)
        except (TypeError, ValueError):
            pass

        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        limit_raw = request.query_params.get("limit")
        if limit_raw is None:
            return super().list(request, *args, **kwargs)

        queryset = self.filter_queryset(self.get_queryset())
        try:
            limit = max(1, min(100, int(limit_raw)))
        except (TypeError, ValueError):
            limit = 24
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
        serializer.save(user=self.request.user, status=MealPlan.Status.DRAFT)

    def perform_update(self, serializer):
        plan = self.get_object()
        is_owner = plan.user_id == self.request.user.id
        is_admin = self.request.user.is_superuser or getattr(self.request.user.role, "name", "") == "admin"
        if not (is_owner or is_admin):
            raise PermissionDenied("You can edit only your meal plans.")
        serializer.save()

    def perform_destroy(self, instance):
        is_owner = instance.user_id == self.request.user.id
        is_admin = self.request.user.is_superuser or getattr(self.request.user.role, "name", "") == "admin"
        if not (is_owner or is_admin):
            raise PermissionDenied("You can delete only your meal plans.")
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted", "updated_at"])

    @action(detail=True, methods=["post"])
    def submit_for_moderation(self, request, pk=None):
        plan = self.get_object()
        if plan.user_id != request.user.id:
            return Response({"detail": "Only owner can submit for moderation."}, status=status.HTTP_403_FORBIDDEN)
        plan.status = MealPlan.Status.PENDING
        plan.save(update_fields=["status", "updated_at"])
        return Response(MealPlanSerializer(plan).data)

    @action(detail=True, methods=["post"])
    def moderate(self, request, pk=None):
        plan = self.get_object()
        new_status = request.data.get("status")
        if new_status not in {MealPlan.Status.APPROVED, MealPlan.Status.REJECTED}:
            return Response({"detail": "Status must be approved or rejected."}, status=status.HTTP_400_BAD_REQUEST)
        plan.status = new_status
        plan.save(update_fields=["status", "updated_at"])
        Notification.objects.create(
            user=plan.user,
            event_type=Notification.EventType.PLAN_MODERATION,
            message=f"Meal plan #{plan.id} moderation status: {new_status}.",
        )
        return Response(MealPlanSerializer(plan).data)


class ShoppingListViewSet(viewsets.ModelViewSet):
    queryset = ShoppingList.objects.prefetch_related("items").all()
    serializer_class = ShoppingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
