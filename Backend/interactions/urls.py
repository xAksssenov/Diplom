from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ComplaintViewSet, FavoriteViewSet, ReviewViewSet

router = DefaultRouter()
router.register("reviews", ReviewViewSet, basename="review")
router.register("complaints", ComplaintViewSet, basename="complaint")
router.register("favorites", FavoriteViewSet, basename="favorite")

urlpatterns = [path("", include(router.urls))]
