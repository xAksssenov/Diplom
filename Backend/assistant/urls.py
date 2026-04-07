from django.urls import path

from .views import AssistantChatAPIView

urlpatterns = [
    path("chat/", AssistantChatAPIView.as_view(), name="assistant-chat"),
]
