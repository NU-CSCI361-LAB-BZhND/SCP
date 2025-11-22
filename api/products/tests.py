from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from companies.models import Supplier, Consumer, Link, LinkStatus
from products.models import Product
from users.models import UserRole

User = get_user_model()


class ProductCatalogTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('product-list')

        # 1. Setup Supplier A
        self.supplier_a = Supplier.objects.create(company_name="Supplier A", address="123 A St")
        self.user_supplier_a = User.objects.create_user("supA@test.com", "pass123", role=UserRole.OWNER)
        self.user_supplier_a.supplier = self.supplier_a
        self.user_supplier_a.save()

        # 2. Setup Supplier B
        self.supplier_b = Supplier.objects.create(company_name="Supplier B", address="123 B St")
        self.user_supplier_b = User.objects.create_user("supB@test.com", "pass123", role=UserRole.OWNER)
        self.user_supplier_b.supplier = self.supplier_b
        self.user_supplier_b.save()

        # 3. Setup Consumers
        self.consumer = Consumer.objects.create(company_name="Consumer Inc", address="456 C St")
        self.user_consumer = User.objects.create_user("con@test.com", "pass123", role=UserRole.CONSUMER)
        self.user_consumer.consumer = self.consumer
        self.user_consumer.save()

        self.another_consumer = Consumer.objects.create(company_name="Consumer2 Inc", address="456 C St")
        self.user_another_consumer = User.objects.create_user("con2@test.com", "pass123", role=UserRole.CONSUMER)
        self.user_another_consumer = self.another_consumer
        self.user_another_consumer.save()

        # 4. Create some products for Supplier A
        self.potato = Product.objects.create(
            supplier=self.supplier_a,
            name="Potato",
            price=10.00,
            stock_level=100,
            unit="kg",
            is_available=True
        )

        # Create a hidden product
        self.secret_sauce = Product.objects.create(
            supplier=self.supplier_a,
            name="Crabsburger formula",
            price=50.00,
            stock_level=1,
            unit="qty",
            is_available=False
        )

        # Create product for Supplier B
        self.carrot = Product.objects.create(
            supplier=self.supplier_b,
            name="Carrot",
            price=5.00,
            stock_level=50,
            unit="kg"
        )


    def test_supplier_can_create_product(self):
        """Test that a supplier can add a product and it is auto assigned"""
        self.client.force_authenticate(user=self.user_supplier_a)
        data = {
            "name": "New Item",
            "description": "Fresh",
            "price": "15.50",
            "stock_level": 20,
            "unit": "box"
        }
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.filter(supplier=self.supplier_a).count(), 3)

    def test_supplier_cannot_edit_other_suppliers_product(self):
        """Test: Supplier A cannot edit Supplier B's product"""
        self.client.force_authenticate(user=self.user_supplier_a)

        # Try to edit Supplier B's Carrot
        url = reverse('product-detail', args=[self.carrot.id])
        response = self.client.patch(url, {"price": "999.99"})

        # Should be 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unlinked_consumer_sees_empty_catalog(self):
        """Test that a consumer with no links sees nothing"""
        self.client.force_authenticate(user=self.user_consumer)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # Should see 0 products

    def test_pending_consumer_sees_empty_catalog(self):
        """Test that a PENDING link is not enough to see the catalog"""
        Link.objects.create(supplier=self.supplier_a, consumer=self.consumer, status=LinkStatus.PENDING)

        self.client.force_authenticate(user=self.user_consumer)
        response = self.client.get(self.list_url)

        self.assertEqual(len(response.data), 0)

    def test_linked_consumer_sees_only_linked_products(self):
        """Test that ACCEPTED link reveals the catalog"""
        Link.objects.create(supplier=self.supplier_a, consumer=self.consumer, status=LinkStatus.ACCEPTED)
        Link.objects.create(supplier=self.supplier_b, consumer=self.another_consumer, status=LinkStatus.ACCEPTED)

        self.client.force_authenticate(user=self.user_consumer)
        response = self.client.get(self.list_url)

        # Should see "Potato" (Supplier A)
        # Should NOT see "Carrot" (Supplier B - not linked)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Potato")

    def test_consumer_cannot_see_unavailable_products(self):
        """Test that hidden products remain hidden even if linked"""
        Link.objects.create(supplier=self.supplier_a, consumer=self.consumer, status=LinkStatus.ACCEPTED)

        self.client.force_authenticate(user=self.user_consumer)
        response = self.client.get(self.list_url)

        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Potato")