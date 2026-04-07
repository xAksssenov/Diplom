from rest_framework import serializers

from .models import MealPlan, MealPlanItem, ShoppingList, ShoppingListItem


class MealPlanItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealPlanItem
        fields = ("id", "day_number", "meal_type", "recipe", "servings")


class MealPlanSerializer(serializers.ModelSerializer):
    items = MealPlanItemSerializer(many=True, required=False)
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = MealPlan
        fields = (
            "id",
            "user",
            "user_name",
            "plan_type",
            "start_date",
            "end_date",
            "total_calories",
            "status",
            "is_deleted",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("user", "created_at", "updated_at")

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        plan = MealPlan.objects.create(**validated_data)
        for item in items_data:
            MealPlanItem.objects.create(meal_plan=plan, **item)
        return plan

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                MealPlanItem.objects.create(meal_plan=instance, **item)
        return instance


class ShoppingListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoppingListItem
        fields = ("id", "ingredient", "ingredient_name", "quantity", "unit", "is_purchased")


class ShoppingListSerializer(serializers.ModelSerializer):
    items = ShoppingListItemSerializer(many=True, required=False)

    class Meta:
        model = ShoppingList
        fields = (
            "id",
            "user",
            "target_type",
            "target_id",
            "title",
            "status",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("user", "created_at", "updated_at")

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        shopping_list = ShoppingList.objects.create(**validated_data)
        for item in items_data:
            ShoppingListItem.objects.create(shopping_list=shopping_list, **item)
        return shopping_list

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                ShoppingListItem.objects.create(shopping_list=instance, **item)
        return instance
