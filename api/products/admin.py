from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'supplier', 'price', 'stock_level', 'unit')
    search_fields = ('name', 'supplier__name')
    list_filter = ('supplier',)