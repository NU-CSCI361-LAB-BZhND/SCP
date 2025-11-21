from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from companies.models import Consumer, Supplier

User = get_user_model()

class Command(BaseCommand):
    help = "Seed users, user groups, and user permissions (idempotent)"

    def handle(self, *args, **kwargs):
        # Grab example consumers, suppliers, and groups
        consumer = Consumer.objects.first()
        supplier = Supplier.objects.first()

        # Ensure groups exist
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        consumer_group, _ = Group.objects.get_or_create(name="ConsumerUser")
        supplier_group, _ = Group.objects.get_or_create(name="SupplierUser")

        permissions = Permission.objects.all()

        # Users
        users_data = [
            {"email":"admin@example.com","first_name":"Admin","last_name":"User","role":"admin","is_superuser":True,"is_staff":True,"is_active":True,"password":"AdminPass123","groups":[Group.objects.get(name="Admin")]},
            {"email":"consumer1@example.com","first_name":"Consumer1","last_name":"User","role":"consumer","is_superuser":False,"is_staff":False,"is_active":True,"consumer":Consumer.objects.get(company_name="Consumer A"),"password":"Consumer1Pass","groups":[Group.objects.get(name="ConsumerUser")]},
            {"email":"consumer2@example.com","first_name":"Consumer2","last_name":"User","role":"consumer","is_superuser":False,"is_staff":False,"is_active":True,"consumer":Consumer.objects.get(company_name="Consumer B"),"password":"Consumer2Pass","groups":[Group.objects.get(name="ConsumerUser")]},
            {"email":"consumer3@example.com","first_name":"Consumer3","last_name":"User","role":"consumer","is_superuser":False,"is_staff":False,"is_active":True,"consumer":Consumer.objects.get(company_name="Consumer C"),"password":"Consumer3Pass","groups":[Group.objects.get(name="ConsumerUser")]},
            {"email":"consumer4@example.com","first_name":"Consumer4","last_name":"User","role":"consumer","is_superuser":False,"is_staff":False,"is_active":True,"consumer":Consumer.objects.get(company_name="Consumer D"),"password":"Consumer4Pass","groups":[Group.objects.get(name="ConsumerUser")]},
            {"email":"supplier1@example.com","first_name":"Supplier1","last_name":"User","role":"supplier","is_superuser":False,"is_staff":False,"is_active":True,"supplier":Supplier.objects.get(company_name="Supplier A"),"password":"Supplier1Pass","groups":[Group.objects.get(name="SupplierUser")]},
            {"email":"supplier2@example.com","first_name":"Supplier2","last_name":"User","role":"supplier","is_superuser":False,"is_staff":False,"is_active":True,"supplier":Supplier.objects.get(company_name="Supplier B"),"password":"Supplier2Pass","groups":[Group.objects.get(name="SupplierUser")]},
            {"email":"supplier3@example.com","first_name":"Supplier3","last_name":"User","role":"supplier","is_superuser":False,"is_staff":False,"is_active":True,"supplier":Supplier.objects.get(company_name="Supplier C"),"password":"Supplier3Pass","groups":[Group.objects.get(name="SupplierUser")]},
            {"email":"supplier4@example.com","first_name":"Supplier4","last_name":"User","role":"supplier","is_superuser":False,"is_staff":False,"is_active":True,"supplier":Supplier.objects.get(company_name="Supplier D"),"password":"Supplier4Pass","groups":[Group.objects.get(name="SupplierUser")]},
            {"email":"supplier5@example.com","first_name":"Supplier5","last_name":"User","role":"supplier","is_superuser":False,"is_staff":False,"is_active":True,"supplier":Supplier.objects.get(company_name="Supplier E"),"password":"Supplier5Pass","groups":[Group.objects.get(name="SupplierUser")]}
        ]


        for u in users_data:
            user, created = User.objects.get_or_create(email=u["email"], defaults={
                k: v for k, v in u.items() if k not in ["password", "groups", "user_permissions", "consumer", "supplier"]
            })

            # Update fields if user already exists
            for key, value in u.items():
                if key in ["consumer", "supplier"]:
                    setattr(user, key, value)
            user.set_password(u["password"])
            user.save()

            # Assign groups
            if "groups" in u:
                user.groups.set(u["groups"])

            # Assign permissions (only for admin)
            if "user_permissions" in u:
                user.user_permissions.set(u["user_permissions"])

        self.stdout.write(self.style.SUCCESS("Users, groups, and permissions seeded idempotently."))
