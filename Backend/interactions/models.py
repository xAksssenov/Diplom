from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Review(models.Model):
    class TargetType(models.TextChoices):
        RECIPE = "recipe", "Recipe"
        MEAL_PLAN = "meal_plan", "Meal plan"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    target_type = models.CharField(max_length=16, choices=TargetType.choices)
    target_id = models.PositiveBigIntegerField()
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "target_type", "target_id"], name="unique_review_per_user"
            )
        ]
        indexes = [
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["is_approved"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"Review #{self.id}"


class Complaint(models.Model):
    class TargetType(models.TextChoices):
        RECIPE = "recipe", "Recipe"
        MEAL_PLAN = "meal_plan", "Meal plan"
        REVIEW = "review", "Review"

    class Status(models.TextChoices):
        NEW = "new", "New"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="complaints",
    )
    target_type = models.CharField(max_length=16, choices=TargetType.choices)
    target_id = models.PositiveBigIntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.NEW)
    response = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="resolved_complaints",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"Complaint #{self.id}"


class Favorite(models.Model):
    class TargetType(models.TextChoices):
        RECIPE = "recipe", "Recipe"
        MEAL_PLAN = "meal_plan", "Meal plan"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
    )
    target_type = models.CharField(max_length=16, choices=TargetType.choices)
    target_id = models.PositiveBigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "target_type", "target_id"], name="unique_user_favorite"
            )
        ]
        indexes = [models.Index(fields=["target_type", "target_id"])]

    def __str__(self) -> str:
        return f"Favorite #{self.id}"
