from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from companies.models import Supplier, Consumer, Link, LinkStatus
from products.models import Product
from orders.models import Order, OrderStatus
from support.models import Complaint, ComplaintStatus, EscalationLevel
from notifications.models import Notification, NotificationType
from users.models import UserRole

User = get_user_model()


class NotificationSystemTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('notification-list')
        self.mark_all_read_url = reverse('notification-mark-all-read')

        # 1. Setup Supplier Team
        self.supplier = Supplier.objects.create(company_name="Alert Corp", address="123 A St")
        self.owner = User.objects.create_user("owner@alert.com", "pass", role=UserRole.OWNER, supplier=self.supplier)
        self.manager = User.objects.create_user("manager@alert.com", "pass", role=UserRole.MANAGER,
                                                supplier=self.supplier)
        self.sales = User.objects.create_user("sales@alert.com", "pass", role=UserRole.SALES_REP,
                                              supplier=self.supplier)

        # 2. Setup Consumer
        self.consumer_org = Consumer.objects.create(company_name="Buyer LLC", address="456 B St")
        self.consumer = User.objects.create_user("buyer@test.com", "pass", role=UserRole.CONSUMER,
                                                 consumer=self.consumer_org)

        # 3. Link & Product
        Link.objects.create(supplier=self.supplier, consumer=self.consumer_org, status=LinkStatus.ACCEPTED)
        self.product = Product.objects.create(supplier=self.supplier, name="P1", price=10, stock_level=100, unit="x")

    def test_order_creation_notifies_supplier_team(self):
        """Test that placing an order notifies Owner, Manager, and Sales Rep"""
        Order.objects.create(consumer=self.consumer_org, supplier=self.supplier, total_amount=10)

        # Verify Owner got it
        self.assertTrue(Notification.objects.filter(recipient=self.owner, type=NotificationType.ORDER).exists())
        # Verify Manager got it
        self.assertTrue(Notification.objects.filter(recipient=self.manager, type=NotificationType.ORDER).exists())
        # Verify Sales got it
        self.assertTrue(Notification.objects.filter(recipient=self.sales, type=NotificationType.ORDER).exists())

        # Verify Consumer did NOT get a notification for their own action
        self.assertFalse(Notification.objects.filter(recipient=self.consumer).exists())

    def test_order_status_change_notifies_consumer(self):
        """Test that updating order status notifies the Consumer"""
        order = Order.objects.create(consumer=self.consumer_org, supplier=self.supplier, total_amount=10)

        Notification.objects.all().delete()

        # Action: Supplier ships order
        order.status = OrderStatus.SHIPPED
        order.save()

        # Verify Consumer got it
        notif = Notification.objects.filter(recipient=self.consumer, type=NotificationType.ORDER).first()
        self.assertIsNotNone(notif)
        self.assertIn("Shipped", notif.title)

    def test_complaint_creation_notifies_supplier_staff(self):
        """Test that filing a complaint notifies Sales, Manager, and Owner"""
        order = Order.objects.create(consumer=self.consumer_org, supplier=self.supplier, total_amount=10)
        Notification.objects.all().delete()  # Clear noise

        # Action: File Complaint
        Complaint.objects.create(order=order, created_by=self.consumer, subject="Bad", description="..")

        # Verify Supplier Staff notified
        self.assertTrue(Notification.objects.filter(recipient=self.sales, type=NotificationType.COMPLAINT).exists())
        self.assertTrue(Notification.objects.filter(recipient=self.manager).exists())

    def test_complaint_escalation_logic(self):
        """Test that Escalation notifies Managers but NOT Sales Reps (Logic Check)"""
        order = Order.objects.create(consumer=self.consumer_org, supplier=self.supplier, total_amount=10)
        complaint = Complaint.objects.create(order=order, created_by=self.consumer, subject="Escalate",
                                             description="..")
        Notification.objects.all().delete()

        # Action: Escalate to Manager
        complaint.escalation_level = EscalationLevel.MANAGER
        complaint.save()

        # Verify Manager and Owner got it
        self.assertTrue(Notification.objects.filter(recipient=self.manager, title="Complaint Escalated").exists())
        self.assertTrue(Notification.objects.filter(recipient=self.owner, title="Complaint Escalated").exists())

        # Verify Sales Rep did NOT get it
        self.assertFalse(Notification.objects.filter(recipient=self.sales, title="Complaint Escalated").exists())

    def test_complaint_resolution_notifies_consumer(self):
        """Test that resolving a ticket notifies the Consumer who filed it"""
        order = Order.objects.create(consumer=self.consumer_org, supplier=self.supplier, total_amount=10)
        complaint = Complaint.objects.create(order=order, created_by=self.consumer, subject="Fix", description="..")
        Notification.objects.all().delete()

        # Action: Resolve
        complaint.status = ComplaintStatus.RESOLVED
        complaint.save()

        # Verify Consumer Notification
        notif = Notification.objects.filter(recipient=self.consumer, type=NotificationType.COMPLAINT).first()
        self.assertIsNotNone(notif)
        self.assertIn("Resolved", notif.title)


    def test_user_sees_only_own_notifications(self):
        """Test that I cannot see notifications belonging to others"""
        # Create 1 for Owner, 1 for Consumer
        Notification.objects.create(recipient=self.owner, title="Owner Secret", message="..")
        Notification.objects.create(recipient=self.consumer, title="Consumer Info", message="..")

        # Login as Consumer
        self.client.force_authenticate(user=self.consumer)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Consumer Info")

    def test_mark_notification_as_read(self):
        """Test marking a single notification as read"""
        notif = Notification.objects.create(recipient=self.consumer, title="Read Me", message="..", is_read=False)

        self.client.force_authenticate(user=self.consumer)
        url = reverse('notification-mark-read', args=[notif.id])

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_read(self):
        """Test the 'Mark All Read' button functionality"""
        # Create 3 unread notifications
        for i in range(3):
            Notification.objects.create(recipient=self.consumer, title=f"Msg {i}", is_read=False)

        self.client.force_authenticate(user=self.consumer)
        response = self.client.post(self.mark_all_read_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify DB
        unread_count = Notification.objects.filter(recipient=self.consumer, is_read=False).count()
        self.assertEqual(unread_count, 0)

    def test_cannot_mark_others_notification_read(self):
        """Test Security: I cannot mark other notification as read"""
        # Notification belongs to Owner
        notif = Notification.objects.create(recipient=self.owner, title="Secret", is_read=False)

        # Login as Consumer
        self.client.force_authenticate(user=self.consumer)
        url = reverse('notification-mark-read', args=[notif.id])

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        notif.refresh_from_db()
        self.assertFalse(notif.is_read)