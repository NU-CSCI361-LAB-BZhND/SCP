from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'supplier', 'price', 'stock_level', 'unit', 'is_available')
    search_fields = ('name', 'supplier__company__name')
    list_filter = ('supplier', 'is_available')