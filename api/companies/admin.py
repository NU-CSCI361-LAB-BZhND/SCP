from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Supplier, Consumer

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'subscription_status', 'created_at')
    list_filter = ('subscription_status',)
    search_fields = ('company_name',)

@admin.register(Consumer)
class ConsumerAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'created_at')
    search_fields = ('company_name',)