from django.conf import settings
from django.db import models


class ModerationLog(models.Model):
    class TargetType(models.TextChoices):
        RECIPE = "recipe", "Recipe"
        REVIEW = "review", "Review"
        MEAL_PLAN = "meal_plan", "Meal plan"
        COMPLAINT = "complaint", "Complaint"

    class Decision(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        UPDATED = "updated", "Updated"

    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="moderation_actions",
    )
    target_type = models.CharField(max_length=16, choices=TargetType.choices)
    target_id = models.PositiveBigIntegerField()
    decision = models.CharField(max_length=16, choices=Decision.choices)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["decision"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"ModerationLog #{self.id}"


class RecipeIngredientChangeNotice(models.Model):
    recipe = models.ForeignKey(
        "recipes.Recipe",
        on_delete=models.CASCADE,
        related_name="ingredient_change_notices",
    )
    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ingredient_change_notices",
    )
    message = models.TextField()
    author_notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipe"]), models.Index(fields=["author_notified"])]

    def __str__(self) -> str:
        return f"RecipeIngredientChangeNotice #{self.id}"
