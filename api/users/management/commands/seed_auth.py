from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Seed auth groups and permissions idempotently"

    def handle(self, *args, **kwargs):
        # Groups (idempotent)
        group_names = ["Admin", "Staff", "ConsumerUser", "SupplierUser"]
        groups = {}
        for name in group_names:
            group, _ = Group.objects.get_or_create(name=name)
            groups[name] = group

        # Get default user permissions (already created by Django)
        content_type_user = ContentType.objects.get_for_model(User)
        permission_codenames = ["add_user", "change_user", "delete_user"]
        permissions = Permission.objects.filter(content_type=content_type_user, codename__in=permission_codenames)

        # Assign permissions to groups
        groups["Admin"].permissions.set(permissions)       # Admin gets all
        groups["Staff"].permissions.set(permissions[:2])   # Staff gets add/change

        self.stdout.write(self.style.SUCCESS("Groups and permissions seeded idempotently."))
