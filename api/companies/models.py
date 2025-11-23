from django.db import models

# Create your models here.

class SubscriptionStatus(models.TextChoices):
    TRIAL = 'TRIAL', 'Trial'
    ACTIVE = 'ACTIVE', 'Active'
    EXPIRED = 'EXPIRED', 'Expired'

class LinkStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    BLOCKED = 'BLOCKED', 'Blocked'

class DeliveryMethod(models.TextChoices):
    DELIVERY = 'DELIVERY', 'Delivery Only'
    PICKUP = 'PICKUP', 'Pickup Only'
    BOTH = 'BOTH', 'Delivery & Pickup'

class Supplier(models.Model):
    company_name = models.CharField(max_length=255)
    address = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name

class Consumer(models.Model):
    company_name = models.CharField(max_length=255)
    address = models.TextField()
    delivery_options = models.CharField(
        max_length=20,
        choices=DeliveryMethod.choices,
        default=DeliveryMethod.BOTH
    )
    lead_time = models.PositiveIntegerField(
        default=1,
        help_text="Average days to fulfill an order"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name

class Link(models.Model):
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name='links'
    )
    consumer = models.ForeignKey(
        Consumer,
        on_delete=models.CASCADE,
        related_name='links'
    )
    status = models.CharField(
        max_length=20,
        choices=LinkStatus.choices,
        default=LinkStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensures a Consumer cannot request the same Supplier twice
        unique_together = ('supplier', 'consumer')

    def __str__(self):
        return f"{self.consumer} -> {self.supplier} ({self.status})"
