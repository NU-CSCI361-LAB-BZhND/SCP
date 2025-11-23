from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from orders.models import Order
from support.models import Complaint, EscalationLevel, ComplaintStatus
from .models import Notification, NotificationType
from users.models import UserRole

User = get_user_model()

@receiver(post_save, sender=Order)
def notify_order_events(sender, instance, created, **kwargs):
    # New Order Created -> Notify Supplier Staff
    if created:
        staff = User.objects.filter(supplier=instance.supplier, is_active=True)
        for user in staff:
            Notification.objects.create(
                recipient=user,
                type=NotificationType.ORDER,
                title="New Order Received",
                message=f"Order #{instance.id} placed by {instance.consumer.company_name}.",
                related_id=instance.id
            )

    # Status Change -> Notify Consumer
    if not created:
        # We check if status changed
        Notification.objects.create(
            recipient=instance.consumer.staff.first(),
            type=NotificationType.ORDER,
            title=f"Order {instance.status.title()}",
            message=f"Your order #{instance.id} is now {instance.status}.",
            related_id=instance.id
        )

@receiver(post_save, sender=Complaint)
def notify_complaint_events(sender, instance, created, **kwargs):
    # New Complaint -> Notify Supplier
    if created:
        target_roles = [UserRole.SALES_REP, UserRole.MANAGER, UserRole.OWNER]
        staff = User.objects.filter(
            supplier=instance.order.supplier,
            role__in=target_roles,
            is_active=True
        )
        for user in staff:
            Notification.objects.create(
                recipient=user,
                type=NotificationType.COMPLAINT,
                title="New Complaint",
                message=f"Complaint filed on Order #{instance.order.id}.",
                related_id=instance.id
            )

    # Escalation -> Notify Managers/Owners
    if not created and instance.escalation_level in [EscalationLevel.MANAGER, EscalationLevel.OWNER]:
        target_roles = [UserRole.MANAGER, UserRole.OWNER]
        staff = User.objects.filter(
            supplier=instance.order.supplier,
            role__in=target_roles,
            is_active=True
        )
        for user in staff:
            Notification.objects.create(
                recipient=user,
                type=NotificationType.COMPLAINT,
                title="Complaint Escalated",
                message=f"Complaint #{instance.id} requires attention (Level: {instance.escalation_level}).",
                related_id=instance.id
            )

    if not created and instance.status == ComplaintStatus.RESOLVED:
        Notification.objects.create(
            recipient=instance.created_by,  # The user who filed it
            type=NotificationType.COMPLAINT,
            title="Complaint Resolved",
            message=f"Your complaint regarding Order #{instance.order.id} has been resolved.",
            related_id=instance.id
        )