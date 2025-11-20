from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
# Register your models here.

class CustomUserAdmin(UserAdmin):

    model = User
    list_display = ('email', 'role', 'supplier', 'consumer', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser', 'supplier', 'consumer')

    # This configures the editing page
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Company Info', {'fields': ('role', 'supplier', 'consumer')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    # This configures the "add user" page
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'password2', 'role', 'supplier', 'consumer'),
        }),
    )
    search_fields = ('email',)
    ordering = ('email',)

admin.site.register(User, CustomUserAdmin)