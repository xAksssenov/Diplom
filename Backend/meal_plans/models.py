from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class MealPlan(models.Model):
    class PlanType(models.TextChoices):
        PERSONAL = "personal", "Personal"
        FITNESS = "fitness", "Fitness"
        THERAPEUTIC = "therapeutic", "Therapeutic"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="meal_plans",
    )
    plan_type = models.CharField(
        max_length=32, choices=PlanType.choices, default=PlanType.PERSONAL
    )
    start_date = models.DateField()
    end_date = models.DateField()
    total_calories = models.DecimalField(
        max_digits=9, decimal_places=2, validators=[MinValueValidator(0)]
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT
    )
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["status"]),
            models.Index(fields=["start_date", "end_date"]),
        ]

    def __str__(self) -> str:
        return f"MealPlan #{self.id} ({self.user_id})"


class MealPlanItem(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = "breakfast", "Breakfast"
        LUNCH = "lunch", "Lunch"
        DINNER = "dinner", "Dinner"
        SNACK = "snack", "Snack"

    meal_plan = models.ForeignKey(
        MealPlan,
        on_delete=models.CASCADE,
        related_name="items",
    )
    day_number = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    meal_type = models.CharField(max_length=16, choices=MealType.choices)
    recipe = models.ForeignKey(
        "recipes.Recipe",
        on_delete=models.CASCADE,
        related_name="meal_plan_items",
    )
    servings = models.DecimalField(
        max_digits=5, decimal_places=2, validators=[MinValueValidator(0.25)]
    )

    class Meta:
        ordering = ["meal_plan_id", "day_number", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["meal_plan", "day_number", "meal_type", "recipe"],
                name="unique_meal_plan_item_slot",
            )
        ]
        indexes = [
            models.Index(fields=["meal_plan", "day_number"]),
            models.Index(fields=["meal_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.meal_plan_id}:{self.day_number}:{self.meal_type}"


class ShoppingList(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shopping_lists",
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user"]), models.Index(fields=["status"])]

    def __str__(self) -> str:
        return f"ShoppingList #{self.id}"


class ShoppingListItem(models.Model):
    shopping_list = models.ForeignKey(
        ShoppingList,
        on_delete=models.CASCADE,
        related_name="items",
    )
    ingredient = models.ForeignKey(
        "recipes.Ingredient",
        on_delete=models.CASCADE,
        related_name="shopping_list_items",
    )
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    unit = models.CharField(max_length=32, default="g")
    is_purchased = models.BooleanField(default=False)

    class Meta:
        ordering = ["shopping_list_id", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["shopping_list", "ingredient", "unit"],
                name="unique_shopping_list_item",
            )
        ]
        indexes = [
            models.Index(fields=["shopping_list"]),
            models.Index(fields=["is_purchased"]),
        ]

    def __str__(self) -> str:
        return f"{self.shopping_list_id}:{self.ingredient_id}"
