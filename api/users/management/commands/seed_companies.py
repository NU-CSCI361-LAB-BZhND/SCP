from django.core.management.base import BaseCommand
from companies.models import Consumer, Supplier
from django.utils import timezone

class Command(BaseCommand):
    help = "Seed consumers and suppliers idempotently"

    def handle(self, *args, **kwargs):
        # Consumers
        consumers_data = [
            {"company_name": "Consumer A", "address": "Address 1"},
            {"company_name": "Consumer B", "address": "Address 2"},
            {"company_name": "Consumer C", "address": "Address 3"},
            {"company_name": "Consumer D", "address": "Address 4"},
            {"company_name": "Consumer E", "address": "Address 5"},
            {"company_name": "Consumer F", "address": "Address 6"},
            {"company_name": "Consumer G", "address": "Address 7"},
            {"company_name": "Consumer H", "address": "Address 8"},
            {"company_name": "Consumer I", "address": "Address 9"},
            {"company_name": "Consumer J", "address": "Address 10"},
        ]


        for c in consumers_data:
            consumer, created = Consumer.objects.get_or_create(
                company_name=c["company_name"],
                defaults={
                    "address": c["address"],
                    "created_at": timezone.now()
                }
            )
            if not created:
                # Optional: update address if you want
                consumer.address = c["address"]
                consumer.save()

        # Suppliers
        suppliers_data = [
            {"company_name": "Supplier A", "address": "Address 11", "subscription_status": "Active"},
            {"company_name": "Supplier B", "address": "Address 12", "subscription_status": "Inactive"},
            {"company_name": "Supplier C", "address": "Address 13", "subscription_status": "Active"},
            {"company_name": "Supplier D", "address": "Address 14", "subscription_status": "Inactive"},
            {"company_name": "Supplier E", "address": "Address 15", "subscription_status": "Active"},
            {"company_name": "Supplier F", "address": "Address 16", "subscription_status": "Active"},
            {"company_name": "Supplier G", "address": "Address 17", "subscription_status": "Inactive"},
            {"company_name": "Supplier H", "address": "Address 18", "subscription_status": "Active"},
            {"company_name": "Supplier I", "address": "Address 19", "subscription_status": "Inactive"},
            {"company_name": "Supplier J", "address": "Address 20", "subscription_status": "Active"},
        ]


        for s in suppliers_data:
            supplier, created = Supplier.objects.get_or_create(
                company_name=s["company_name"],
                defaults={
                    "address": s["address"],
                    "subscription_status": s["subscription_status"],
                    "created_at": timezone.now()
                }
            )
            if not created:
                # Optional: update fields if you want
                supplier.address = s["address"]
                supplier.subscription_status = s["subscription_status"]
                supplier.save()

        self.stdout.write(self.style.SUCCESS("Consumers and suppliers seeded idempotently."))
