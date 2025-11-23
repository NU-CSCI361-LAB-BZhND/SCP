from django.db import models
from django.utils.translation import gettext_lazy as _
from companies.models import Supplier, Consumer
from products.models import Product
# Create your models here.

class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    CONFIRMED = 'CONFIRMED', _('Confirmed')
    SHIPPED = 'SHIPPED', _('Shipped')
    DELIVERED = 'DELIVERED', _('Delivered')
    CANCELED = 'CANCELED', _('Canceled')
    DECLINED = 'DECLINED', _('Declined')


class Order(models.Model):
    consumer = models.ForeignKey(
        Consumer,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )
    is_active = models.BooleanField(
        default=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.consumer} -> {self.supplier}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT
    )
    quantity = models.PositiveIntegerField()

    price_at_time_of_order = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.product.name} (Order #{self.order.id})"

    @property
    def total_price(self):
        return self.quantity * self.price_at_time_of_order