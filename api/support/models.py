from django.db import models
from django.contrib.auth import get_user_model
from orders.models import Order
from companies.models import Consumer, Supplier

# Create your models here.

User = get_user_model()
class ComplaintStatus(models.TextChoices):
    OPEN = 'OPEN', 'Open'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    RESOLVED = 'RESOLVED', 'Resolved'
    DISMISSED = 'DISMISSED', 'Dismissed'

class EscalationLevel(models.TextChoices):
    SALES_REP = 'SALES_REP', 'Sales Representative'
    MANAGER = 'MANAGER', 'Manager'
    OWNER = 'OWNER', 'Owner'


class Complaint(models.Model):
    # Link to the specific order being complained about
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='complaints')

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints_filed')

    subject = models.CharField(max_length=255)
    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=ComplaintStatus.choices,
        default=ComplaintStatus.OPEN
    )

    escalation_level = models.CharField(
        max_length=20,
        choices=EscalationLevel.choices,
        default=EscalationLevel.SALES_REP
    )

    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_complaints'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Complaint #{self.id} on Order #{self.order.id}"

class ChatThread(models.Model):
    consumer = models.ForeignKey(Consumer, on_delete=models.CASCADE, related_name='chat_threads')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='chat_threads')

    escalation_level = models.CharField(
        max_length=20,
        choices=EscalationLevel.choices,
        default=EscalationLevel.SALES_REP
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('consumer', 'supplier')  # One thread per pair
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat: {self.consumer} <-> {self.supplier}"


class ChatMessage(models.Model):
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)

    text = models.TextField(blank=True)
    file = models.FileField(upload_to='chat_uploads/', null=True, blank=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg from {self.sender.email} at {self.created_at}"

