from django.db import models
from django.contrib.auth import get_user_model
# Create your models here.

User = get_user_model()

class NotificationType(models.TextChoices):
    ORDER = 'ORDER', 'Order Update'
    COMPLAINT = 'COMPLAINT', 'Complaint Update'
    SYSTEM = 'SYSTEM', 'System Message'


class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')

    type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_id = models.IntegerField(null=True, blank=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']  # Newest first

    def __str__(self):
        return f"Notification for {self.recipient.email}: {self.title}"