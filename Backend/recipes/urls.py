from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, IngredientViewSet, RecipeViewSet, TagViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("ingredients", IngredientViewSet, basename="ingredient")
router.register("tags", TagViewSet, basename="tag")
router.register("", RecipeViewSet, basename="recipe")

urlpatterns = [path("", include(router.urls))]
