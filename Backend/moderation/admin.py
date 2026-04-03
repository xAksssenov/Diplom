from django.contrib import admin

from .models import ModerationLog, RecipeIngredientChangeNotice


@admin.register(ModerationLog)
class ModerationLogAdmin(admin.ModelAdmin):
    list_display = ("id", "moderator", "target_type", "target_id", "decision", "created_at")
    list_filter = ("target_type", "decision")


@admin.register(RecipeIngredientChangeNotice)
class RecipeIngredientChangeNoticeAdmin(admin.ModelAdmin):
    list_display = ("id", "recipe", "moderator", "author_notified", "created_at")
    list_filter = ("author_notified",)
