from django.contrib import admin

from .models import MealPlan, MealPlanItem, ShoppingList, ShoppingListItem


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "plan_type", "status", "start_date", "end_date")
    list_filter = ("status", "plan_type")


@admin.register(MealPlanItem)
class MealPlanItemAdmin(admin.ModelAdmin):
    list_display = ("id", "meal_plan", "day_number", "meal_type", "recipe", "servings")
    list_filter = ("meal_type",)


@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "created_at")
    list_filter = ("status",)


@admin.register(ShoppingListItem)
class ShoppingListItemAdmin(admin.ModelAdmin):
    list_display = ("id", "shopping_list", "ingredient", "quantity", "unit", "is_purchased")
    list_filter = ("is_purchased",)
