from django.db import models

class Product(models.Model):
    supplier = models.ForeignKey(
        'companies.Supplier',
        on_delete=models.CASCADE,
        related_name='products'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    unit = models.CharField(max_length=50)
    stock_level = models.IntegerField()
    min_order_qty = models.PositiveIntegerField(
        default=1,
        help_text="Minimum quantity required to order."
    )
    is_available = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)

    class Meta:
        db_table = 'product'  # optional, only if you want exact table name

    def __str__(self):
        return self.name

