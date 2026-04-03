from django.conf import settings
from django.db import models


class Notification(models.Model):
    class EventType(models.TextChoices):
        RECIPE_MODERATION = "recipe_moderation", "Recipe moderation"
        REVIEW_MODERATION = "review_moderation", "Review moderation"
        PLAN_MODERATION = "plan_moderation", "Meal plan moderation"
        NEW_COMPLAINT = "new_complaint", "New complaint"
        COMPLAINT_RESPONSE = "complaint_response", "Complaint response"
        SYSTEM = "system", "System"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    message = models.TextField()
    event_type = models.CharField(
        max_length=32, choices=EventType.choices, default=EventType.SYSTEM
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["event_type"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"Notification #{self.id}"
