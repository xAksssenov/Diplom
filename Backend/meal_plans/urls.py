from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MealPlanViewSet, ShoppingListViewSet

router = DefaultRouter()
router.register("shopping-lists", ShoppingListViewSet, basename="shopping-list")
router.register("", MealPlanViewSet, basename="meal-plan")

urlpatterns = [path("", include(router.urls))]
