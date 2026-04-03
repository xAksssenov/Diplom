from rest_framework import serializers

from .models import Category, Ingredient, Recipe, RecipeIngredient, Tag


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = "__all__"


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"


class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source="ingredient.name", read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ("id", "ingredient", "ingredient_name", "quantity", "unit")


class RecipeSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", read_only=True)
    recipe_ingredients = RecipeIngredientSerializer(many=True, required=False)
    tags = serializers.PrimaryKeyRelatedField(many=True, queryset=Tag.objects.all(), required=False)

    class Meta:
        model = Recipe
        fields = (
            "id",
            "title",
            "category",
            "description",
            "cooking_time",
            "difficulty",
            "instructions",
            "nutrition_calories",
            "nutrition_protein",
            "nutrition_fat",
            "nutrition_carbs",
            "author",
            "author_name",
            "status",
            "is_deleted",
            "tags",
            "recipe_ingredients",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("author", "created_at", "updated_at")

    def create(self, validated_data):
        ingredients_data = validated_data.pop("recipe_ingredients", [])
        tags = validated_data.pop("tags", [])
        recipe = Recipe.objects.create(**validated_data)
        if tags:
            recipe.tags.set(tags)
        for item in ingredients_data:
            RecipeIngredient.objects.create(recipe=recipe, **item)
        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop("recipe_ingredients", None)
        tags = validated_data.pop("tags", None)
        instance = super().update(instance, validated_data)
        if tags is not None:
            instance.tags.set(tags)
        if ingredients_data is not None:
            instance.recipe_ingredients.all().delete()
            for item in ingredients_data:
                RecipeIngredient.objects.create(recipe=instance, **item)
        return instance
