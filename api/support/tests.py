from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from companies.models import Supplier, Consumer, Link, LinkStatus
from products.models import Product
from orders.models import Order
from support.models import Complaint, ComplaintStatus, EscalationLevel
from users.models import UserRole

User = get_user_model()


class ComplaintTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('complaint-list')

        # 1. Setup Actors
        self.supplier = Supplier.objects.create(company_name="FixIt Inc", address="123 A St")
        self.user_supplier = User.objects.create_user("sup@test.com", "pass", role=UserRole.OWNER)
        self.user_supplier.supplier = self.supplier
        self.user_supplier.save()

        self.consumer = Consumer.objects.create(company_name="Complainers LLC", address="456 B St")
        self.user_consumer = User.objects.create_user("con@test.com", "pass", role=UserRole.CONSUMER)
        self.user_consumer.consumer = self.consumer
        self.user_consumer.save()

        self.other_consumer = Consumer.objects.create(company_name="Stranger Inc", address="789 C St")
        self.user_other = User.objects.create_user("other@test.com", "pass", role=UserRole.CONSUMER)
        self.user_other.consumer = self.other_consumer
        self.user_other.save()

        # 2. Setup Product & Link
        Link.objects.create(supplier=self.supplier, consumer=self.consumer, status=LinkStatus.ACCEPTED)
        self.product = Product.objects.create(
            supplier=self.supplier, name="Broken Widget", price=10.00, stock_level=100, unit="pcs"
        )

        # 3. Setup Orders (One for our consumer, one for someone else)
        self.order = Order.objects.create(consumer=self.consumer, supplier=self.supplier, total_amount=10.00)
        self.other_order = Order.objects.create(consumer=self.other_consumer, supplier=self.supplier,
                                                total_amount=10.00)

    # --- CONSUMER ACTIONS ---

    def test_consumer_can_file_complaint(self):
        """Test that a Consumer can file a complaint on their own order"""
        self.client.force_authenticate(user=self.user_consumer)

        data = {
            "order": self.order.id,
            "subject": "Defective Item",
            "description": "It arrived broken."
        }
        response = self.client.post(self.list_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Complaint.objects.count(), 1)

        # Check Defaults
        complaint = Complaint.objects.get()
        self.assertEqual(complaint.status, ComplaintStatus.OPEN)
        self.assertEqual(complaint.escalation_level, EscalationLevel.SALES_REP)

    def test_consumer_cannot_complain_about_others_order(self):
        """Test Security: Consumer cannot file complaint on an order they didn't make"""
        self.client.force_authenticate(user=self.user_consumer)

        data = {
            "order": self.other_order.id,  # Belongs to 'Stranger Inc'
            "subject": "Hacking",
            "description": "Trying to complain about random order."
        }
        response = self.client.post(self.list_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Verify logic from serializer validation
        self.assertTrue("own orders" in str(response.data))

    def test_consumer_sees_only_own_complaints(self):
        """Test filtering: Consumer sees only their list"""
        # Create 1 complaint for Consumer
        Complaint.objects.create(order=self.order, created_by=self.user_consumer, subject="My Issue", description="..")
        # Create 1 complaint for Other Consumer
        Complaint.objects.create(order=self.other_order, created_by=self.user_other, subject="Other Issue",
                                 description="..")

        self.client.force_authenticate(user=self.user_consumer)
        response = self.client.get(self.list_url)

        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['subject'], "My Issue")

    # --- SUPPLIER ACTIONS & ESCALATION ---

    def test_supplier_sees_complaints_for_their_orders(self):
        """Test that Supplier sees complaints from ALL consumers related to their orders"""
        Complaint.objects.create(order=self.order, created_by=self.user_consumer, subject="A", description="..")
        Complaint.objects.create(order=self.other_order, created_by=self.user_other, subject="B", description="..")

        self.client.force_authenticate(user=self.user_supplier)
        response = self.client.get(self.list_url)

        self.assertEqual(len(response.data), 2)  # Supplier sees both

    def test_supplier_can_escalate_ticket(self):
        """Test the State Machine: Sales -> Manager -> Owner"""
        complaint = Complaint.objects.create(
            order=self.order, created_by=self.user_consumer, subject="Escalate Me", description=".."
        )

        self.client.force_authenticate(user=self.user_supplier)
        url = reverse('complaint-escalate', args=[complaint.id])

        # 1. Sales -> Manager
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['level'], EscalationLevel.MANAGER)

        # 2. Manager -> Owner
        response = self.client.post(url)
        self.assertEqual(response.data['level'], EscalationLevel.OWNER)

    def test_escalation_ceiling(self):
        """Test that you cannot escalate beyond Owner"""
        complaint = Complaint.objects.create(
            order=self.order, created_by=self.user_consumer,
            subject="Top", description="..",
            escalation_level=EscalationLevel.OWNER
        )

        self.client.force_authenticate(user=self.user_supplier)
        url = reverse('complaint-escalate', args=[complaint.id])

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], "Already at highest escalation level.")

    def test_consumer_cannot_escalate(self):
        """Test Permissions: Consumers cannot trigger escalation"""
        complaint = Complaint.objects.create(
            order=self.order, created_by=self.user_consumer, subject="Try Escalate", description=".."
        )

        self.client.force_authenticate(user=self.user_consumer)
        url = reverse('complaint-escalate', args=[complaint.id])

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_supplier_can_resolve_complaint(self):
        """Test updating status via PATCH"""
        complaint = Complaint.objects.create(
            order=self.order, created_by=self.user_consumer, subject="Fix Me", description=".."
        )

        self.client.force_authenticate(user=self.user_supplier)
        url = reverse('complaint-detail', args=[complaint.id])

        response = self.client.patch(url, {"status": ComplaintStatus.RESOLVED})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        complaint.refresh_from_db()
        self.assertEqual(complaint.status, ComplaintStatus.RESOLVED)