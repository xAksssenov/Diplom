from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from notifications.models import Notification
from users.permissions import IsAdminRole, IsModeratorOrAdminRole

from .models import Category, Ingredient, Recipe, Tag
from .serializers import CategorySerializer, IngredientSerializer, RecipeSerializer, TagSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAdminRole()]


class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAdminRole()]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [IsAdminRole()]


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.select_related("author", "category").prefetch_related("recipe_ingredients", "tags")
    serializer_class = RecipeSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        if self.action in {"moderate"}:
            return [IsModeratorOrAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset
        return queryset.filter(status=Recipe.ModerationStatus.APPROVED, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, status=Recipe.ModerationStatus.PENDING)

    def perform_update(self, serializer):
        recipe = self.get_object()
        is_admin = getattr(self.request.user.role, "name", "") == "admin" or self.request.user.is_superuser
        is_owner = recipe.author_id == self.request.user.id
        if not (is_owner or is_admin):
            raise PermissionDenied("You can edit only your recipes.")
        serializer.save()

    def perform_destroy(self, instance):
        is_admin = getattr(self.request.user.role, "name", "") == "admin" or self.request.user.is_superuser
        is_owner = instance.author_id == self.request.user.id
        if not (is_owner or is_admin):
            raise PermissionDenied("You can delete only your recipes.")
        instance.is_deleted = True
        instance.save(update_fields=["is_deleted", "updated_at"])

    @action(detail=True, methods=["post"])
    def moderate(self, request, pk=None):
        recipe = self.get_object()
        new_status = request.data.get("status")
        if new_status not in {Recipe.ModerationStatus.APPROVED, Recipe.ModerationStatus.REJECTED}:
            return Response({"detail": "Status must be approved or rejected."}, status=status.HTTP_400_BAD_REQUEST)
        recipe.status = new_status
        recipe.save(update_fields=["status", "updated_at"])
        Notification.objects.create(
            user=recipe.author,
            event_type=Notification.EventType.RECIPE_MODERATION,
            message=f"Recipe #{recipe.id} moderation status: {new_status}.",
        )
        return Response(RecipeSerializer(recipe).data)
