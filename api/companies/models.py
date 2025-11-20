from django.db import models

# Create your models here.

class SubscriptionStatus(models.TextChoices):
    TRIAL = 'TRIAL', 'Trial'
    ACTIVE = 'ACTIVE', 'Active'
    EXPIRED = 'EXPIRED', 'Expired'

class Supplier(models.Model):
    company_name = models.CharField(max_length=255)
    address = models.TextField()
    subscription_status = models.CharField(
        max_length=20,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.TRIAL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name

class Consumer(models.Model):
    company_name = models.CharField(max_length=255)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name
