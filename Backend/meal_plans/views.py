from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

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
        if not self.request.user.is_authenticated:
            return queryset.filter(status=MealPlan.Status.APPROVED, is_deleted=False)
        return queryset

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
