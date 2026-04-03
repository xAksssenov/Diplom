from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health_check(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("api/users/", include("users.urls")),
    path("api/recipes/", include("recipes.urls")),
    path("api/meal-plans/", include("meal_plans.urls")),
    path("api/interactions/", include("interactions.urls")),
    path("api/notifications/", include("notifications.urls")),
]
