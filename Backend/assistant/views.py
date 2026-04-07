import json
from urllib import error, request

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ChatRequestSerializer


class AssistantChatAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request_obj):
        serializer = ChatRequestSerializer(data=request_obj.data)
        serializer.is_valid(raise_exception=True)

        api_key = getattr(settings, "DEEPSEEK_API_KEY", "")
        base_url = getattr(settings, "DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        model = getattr(settings, "DEEPSEEK_MODEL", "deepseek-chat")

        if not api_key:
            return Response(
                {"detail": "Assistant API key is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        messages = serializer.validated_data["messages"]
        deepseek_messages = [
            {
                "role": "system",
                "content": (
                    "Ты ИИ-помощник FoodPlanner. Давай практичные советы по рациону, "
                    "учитывай предпочтения пользователя и отвечай кратко и по делу."
                ),
            }
        ]

        if request_obj.user.is_authenticated:
            profile_context = {
                "name": getattr(request_obj.user, "name", ""),
                "health_goals": getattr(request_obj.user, "health_goals", ""),
                "favorite_tags": getattr(request_obj.user, "favorite_tags", []) or [],
                "health_features": getattr(request_obj.user, "health_features", []) or [],
                "preferred_diet": getattr(request_obj.user, "preferred_diet", ""),
            }
            deepseek_messages.append(
                {
                    "role": "system",
                    "content": f"Контекст профиля пользователя: {json.dumps(profile_context, ensure_ascii=False)}",
                }
            )

        deepseek_messages.extend(messages)

        payload = json.dumps(
            {
                "model": model,
                "messages": deepseek_messages,
                "stream": False,
            }
        ).encode("utf-8")
        endpoint = f"{base_url.rstrip('/')}/chat/completions"
        req = request.Request(
            endpoint,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=25) as response:
                raw = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8")
            return Response(
                {"detail": "DeepSeek request failed.", "error": detail},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except error.URLError:
            return Response(
                {"detail": "DeepSeek service is unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            data = json.loads(raw)
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError, json.JSONDecodeError):
            return Response(
                {"detail": "DeepSeek response format is invalid."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"reply": content})
