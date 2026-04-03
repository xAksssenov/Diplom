from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LoginAPIView, LogoutAPIView, MeAPIView, RegisterAPIView, UserManagementViewSet

router = DefaultRouter()
router.register("manage", UserManagementViewSet, basename="user-management")

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("me/", MeAPIView.as_view(), name="me"),
    path("", include(router.urls)),
]
