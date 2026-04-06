from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers

from .models import Role, User


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ("id", "name")


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source="role",
        write_only=True,
        required=False,
        allow_null=True,
    )
    health_features = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
    )
    favorite_tags = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "avatar_url",
            "health_goals",
            "preferred_diet",
            "health_features",
            "favorite_tags",
            "email_notifications",
            "profile_visibility",
            "role",
            "role_id",
            "registration_date",
            "updated_at",
        )
        read_only_fields = ("registration_date", "updated_at")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    health_features = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
    )
    favorite_tags = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
    )

    class Meta:
        model = User
        fields = (
            "email",
            "name",
            "password",
            "avatar_url",
            "health_goals",
            "preferred_diet",
            "health_features",
            "favorite_tags",
            "email_notifications",
            "profile_visibility",
        )

    @transaction.atomic
    def create(self, validated_data):
        default_role = Role.objects.filter(name="user").first()
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data["name"],
            avatar_url=validated_data.get("avatar_url", ""),
            health_goals=validated_data.get("health_goals", ""),
            preferred_diet=validated_data.get("preferred_diet", ""),
            health_features=validated_data.get("health_features", []),
            favorite_tags=validated_data.get("favorite_tags", []),
            email_notifications=validated_data.get("email_notifications", True),
            profile_visibility=validated_data.get("profile_visibility", False),
            role=default_role,
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        attrs["user"] = user
        return attrs
