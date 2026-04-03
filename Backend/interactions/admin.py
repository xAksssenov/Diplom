from django.contrib import admin

from .models import Complaint, Favorite, Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "target_type", "target_id", "rating", "is_approved")
    list_filter = ("target_type", "is_approved")


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "target_type", "target_id", "status", "created_at")
    list_filter = ("status", "target_type")


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "target_type", "target_id", "created_at")
    list_filter = ("target_type",)
