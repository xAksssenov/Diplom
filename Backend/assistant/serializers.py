from rest_framework import serializers


class ChatMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["system", "user", "assistant"])
    content = serializers.CharField(allow_blank=False, max_length=4000)


class ChatRequestSerializer(serializers.Serializer):
    messages = serializers.ListSerializer(
        child=ChatMessageSerializer(),
        allow_empty=False,
        max_length=20,
    )
