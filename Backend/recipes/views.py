from django.db.models import Avg, CharField, Q
from django.db.models.functions import Cast
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from interactions.models import Review
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
        queryset = queryset.filter(is_deleted=False)

        user_id_raw = self.request.query_params.get("user_id")
        if user_id_raw:
            try:
                queryset = queryset.filter(author_id=int(user_id_raw))
            except (TypeError, ValueError):
                pass

        search_query = (self.request.query_params.get("search") or "").strip()
        if search_query:
            queryset = queryset.annotate(id_str=Cast("id", output_field=CharField()))
            search_filter = (
                Q(id_str__icontains=search_query)
                | Q(title__icontains=search_query)
                | Q(description__icontains=search_query)
                | Q(instructions__icontains=search_query)
                | Q(author__name__icontains=search_query)
                | Q(tags__name__icontains=search_query)
            )
            queryset = queryset.filter(search_filter)

        if self.request.user.is_authenticated:
            if self.request.query_params.get("personalized") == "1":
                preference_query = Q()
                favorite_tags = getattr(self.request.user, "favorite_tags", []) or []
                health_features = getattr(self.request.user, "health_features", []) or []
                for value in [*favorite_tags, *health_features]:
                    if not value:
                        continue
                    preference_query |= Q(tags__name__icontains=value)
                    preference_query |= Q(title__icontains=value)
                    preference_query |= Q(description__icontains=value)
                if preference_query:
                    queryset = queryset.filter(preference_query).distinct()
        else:
            queryset = queryset.filter(status=Recipe.ModerationStatus.APPROVED)

        tags_raw = (self.request.query_params.get("tags") or "").strip()
        if tags_raw:
            tags = [value.strip() for value in tags_raw.split(",") if value.strip()]
            for tag_name in tags:
                queryset = queryset.filter(tags__name__iexact=tag_name)

        try:
            min_calories = self.request.query_params.get("calories_min")
            if min_calories not in (None, ""):
                queryset = queryset.filter(nutrition_calories__gte=float(min_calories))
        except (TypeError, ValueError):
            pass

        try:
            max_calories = self.request.query_params.get("calories_max")
            if max_calories not in (None, ""):
                queryset = queryset.filter(nutrition_calories__lte=float(max_calories))
        except (TypeError, ValueError):
            pass

        try:
            min_time = self.request.query_params.get("time_min")
            if min_time not in (None, ""):
                queryset = queryset.filter(cooking_time__gte=int(min_time))
        except (TypeError, ValueError):
            pass

        try:
            max_time = self.request.query_params.get("time_max")
            if max_time not in (None, ""):
                queryset = queryset.filter(cooking_time__lte=int(max_time))
        except (TypeError, ValueError):
            pass

        try:
            min_rating_raw = self.request.query_params.get("min_rating")
            if min_rating_raw not in (None, ""):
                min_rating = float(min_rating_raw)
                rated_recipe_ids = (
                    Review.objects.filter(target_type=Review.TargetType.RECIPE, is_deleted=False)
                    .values("target_id")
                    .annotate(avg_rating=Avg("rating"))
                    .filter(avg_rating__gte=min_rating)
                    .values_list("target_id", flat=True)
                )
                queryset = queryset.filter(id__in=rated_recipe_ids)
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
