from django.contrib import admin
from django.contrib import admin
from .models import Supplier, Consumer, Link
# Register your models here.


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('company_name',)

@admin.register(Consumer)
class ConsumerAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'created_at')
    search_fields = ('company_name',)

@admin.register(Link)
class LinkAdmin(admin.ModelAdmin):
    list_display = ('consumer', 'supplier', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('consumer__company_name', 'supplier__company_name')