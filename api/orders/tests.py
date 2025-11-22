from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from companies.models import Supplier, Consumer, Link, LinkStatus
from products.models import Product
from orders.models import Order, OrderStatus, OrderItem
from users.models import UserRole

User = get_user_model()


class OrderTransactionTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('order-list')

        # 1. Supplier A
        self.supplier = Supplier.objects.create(company_name="Tech Supply", address="Silicon Valley")
        self.user_supplier = User.objects.create_user("sup@test.com", "pass", role=UserRole.OWNER)
        self.user_supplier.supplier = self.supplier
        self.user_supplier.save()

        # 2. Consumer
        self.consumer = Consumer.objects.create(company_name="Retail Inc", address="NYC")
        self.user_consumer = User.objects.create_user("con@test.com", "pass", role=UserRole.CONSUMER)
        self.user_consumer.consumer = self.consumer
        self.user_consumer.save()

        # 3. Link (ACCEPTED)
        Link.objects.create(
            supplier=self.supplier,
            consumer=self.consumer,
            status=LinkStatus.ACCEPTED
        )

        # 4. Products (Inventory)
        self.laptop = Product.objects.create(
            supplier=self.supplier,
            name="Laptop",
            price=1000.00,
            stock_level=10,  # We have 10 in stock
            unit="pcs"
        )

        self.mouse = Product.objects.create(
            supplier=self.supplier,
            name="Mouse",
            price=50.00,
            stock_level=50,
            unit="pcs"
        )

    def test_consumer_can_place_valid_order(self):
        """
        Test that a valid order:
        1. Creates the Order record
        2. Creates OrderItem records
        3. Deduct from stock immediately
        4. Calculates Total Amount correctly
        """
        self.client.force_authenticate(user=self.user_consumer)

        data = {
            "supplier": self.supplier.id,
            "items": [
                {"product_id": self.laptop.id, "quantity": 2},  # Cost: 2000
                {"product_id": self.mouse.id, "quantity": 5}  # Cost: 250
            ]
        }
        response = self.client.post(self.list_url, data, format='json')

        # 1. Response Check
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['total_amount'], "2250.00")

        # 2. Stock Deduction Check
        self.laptop.refresh_from_db()
        self.mouse.refresh_from_db()
        self.assertEqual(self.laptop.stock_level, 8)
        self.assertEqual(self.mouse.stock_level, 45)

    def test_price_locking_mechanism(self):
        """
        Test that if Supplier changes product price LATER,
        the old order retains the ORIGINAL price.
        """
        # 1. Place Order at 1000
        self.client.force_authenticate(user=self.user_consumer)
        data = {
            "supplier": self.supplier.id,
            "items": [{"product_id": self.laptop.id, "quantity": 1}]
        }
        response = self.client.post(self.list_url, data, format='json')
        order_id = response.data['id']

        # 2. Supplier changes price to 5000
        self.laptop.price = 5000.00
        self.laptop.save()

        # 3. Check the order item record
        order_item = OrderItem.objects.get(order_id=order_id, product=self.laptop)

        # It should still be 1000
        self.assertEqual(order_item.price_at_time_of_order, 1000.00)


    def test_prevent_overselling(self):
        """Test that ordering more than available stock fails and rolls back transaction"""
        self.client.force_authenticate(user=self.user_consumer)

        # Try to buy 11 Laptops (Stock is 10)
        data = {
            "supplier": self.supplier.id,
            "items": [{"product_id": self.laptop.id, "quantity": 11}]
        }
        response = self.client.post(self.list_url, data, format='json')

        # Should fail
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Stock should remain UNTOUCHED
        self.laptop.refresh_from_db()
        self.assertEqual(self.laptop.stock_level, 10)

        # No order should be created
        self.assertEqual(Order.objects.count(), 0)

    def test_prevent_negative_quantity(self):
        """Test that negative numbers are rejected"""
        self.client.force_authenticate(user=self.user_consumer)

        data = {
            "supplier": self.supplier.id,
            "items": [{"product_id": self.laptop.id, "quantity": -5}]
        }
        response = self.client.post(self.list_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_prevent_unlinked_order(self):
        """Test that Consumer cannot buy from Supplier without ACCEPTED link"""
        # Create a new supplier with NO link
        other_supplier = Supplier.objects.create(company_name="Stranger", address="Unknown")
        other_product = Product.objects.create(supplier=other_supplier, name="X", price=10, stock_level=10, unit="x")

        self.client.force_authenticate(user=self.user_consumer)

        data = {
            "supplier": other_supplier.id,
            "items": [{"product_id": other_product.id, "quantity": 1}]
        }
        response = self.client.post(self.list_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_supplier_decline_restocks_inventory(self):
        """
        Test that if Supplier DECLINES an order, the stock is added back.
        """
        # 1. Place Order (Buy 5 Laptops)
        self.client.force_authenticate(user=self.user_consumer)
        data = {
            "supplier": self.supplier.id,
            "items": [{"product_id": self.laptop.id, "quantity": 5}]
        }
        response = self.client.post(self.list_url, data, format='json')
        order_id = response.data['id']

        # Stock is now 5 (10 - 5)
        self.laptop.refresh_from_db()
        self.assertEqual(self.laptop.stock_level, 5)

        # 2. Supplier Declines
        self.client.force_authenticate(user=self.user_supplier)
        url = reverse('order-detail', args=[order_id])

        response = self.client.patch(url, {"status": OrderStatus.DECLINED})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. Verify Restock (Should be back to 10)
        self.laptop.refresh_from_db()
        self.assertEqual(self.laptop.stock_level, 10)

    def test_security_consumer_cannot_change_status(self):
        """Test that Consumer cannot confirm/decline their own order"""
        # 1. Place Order
        self.client.force_authenticate(user=self.user_consumer)
        data = {
            "supplier": self.supplier.id,
            "items": [{"product_id": self.laptop.id, "quantity": 1}]
        }
        response = self.client.post(self.list_url, data, format='json')
        order_id = response.data['id']

        # 2. Try to update status as Consumer
        url = reverse('order-detail', args=[order_id])
        response = self.client.patch(url, {"status": OrderStatus.CONFIRMED})

        # Should be 403 Permission Denied
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)