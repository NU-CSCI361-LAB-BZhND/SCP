from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from companies.models import Supplier, Consumer, Link, LinkStatus
from products.models import Product
from orders.models import Order
from support.models import Complaint, ComplaintStatus, EscalationLevel, ChatThread, ChatMessage
from users.models import UserRole

User = get_user_model()


class SupportTests(APITestCase):
    def setUp(self):
        self.complaint_list_url = reverse('complaint-list')
        self.chat_list_url = reverse('chat-thread-list')

        self.supplier = Supplier.objects.create(company_name="Support Inc", address="123 A St")
        self.owner = User.objects.create_user("owner@sup.com", "pass", role=UserRole.OWNER, supplier=self.supplier)
        self.manager = User.objects.create_user("manager@sup.com", "pass", role=UserRole.MANAGER,
                                                supplier=self.supplier)
        self.sales = User.objects.create_user("sales@sup.com", "pass", role=UserRole.SALES_REP, supplier=self.supplier)

        self.consumer = Consumer.objects.create(company_name="Client LLC", address="456 B St")
        self.user_consumer = User.objects.create_user("con@test.com", "pass", role=UserRole.CONSUMER,
                                                      consumer=self.consumer)

        self.other_consumer_org = Consumer.objects.create(company_name="Stranger Inc", address="789 C St")
        self.other_consumer = User.objects.create_user("other@test.com", "pass", role=UserRole.CONSUMER,
                                                       consumer=self.other_consumer_org)

        Link.objects.create(supplier=self.supplier, consumer=self.consumer, status=LinkStatus.ACCEPTED)

        self.product = Product.objects.create(supplier=self.supplier, name="Widget", price=10, stock_level=100,
                                              unit="pcs")

        self.order = Order.objects.create(consumer=self.consumer, supplier=self.supplier, total_amount=10.00)

        self.other_order = Order.objects.create(consumer=self.other_consumer_org, supplier=self.supplier,
                                                total_amount=10.00)

    def test_consumer_can_file_complaint(self):
        """Test that a Consumer can file a complaint on their own order"""
        self.client.force_authenticate(user=self.user_consumer)

        data = {
            "order": self.order.id,
            "subject": "Broken Item",
            "description": "Fix it please"
        }
        response = self.client.post(self.complaint_list_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Complaint.objects.count(), 1)

        c = Complaint.objects.get()
        self.assertEqual(c.status, ComplaintStatus.OPEN)
        self.assertEqual(c.escalation_level, EscalationLevel.SALES_REP)

    def test_consumer_cannot_complain_about_others_order(self):
        """Test Security: Consumer cannot complain about a stranger's order"""
        self.client.force_authenticate(user=self.user_consumer)

        data = {
            "order": self.other_order.id,  # Belongs to Stranger Inc
            "subject": "Hack",
            "description": ".."
        }
        response = self.client.post(self.complaint_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sales_rep_can_assign_complaint(self):
        """Test that Sales Rep can claim a ticket"""
        complaint = Complaint.objects.create(
            order=self.order, created_by=self.user_consumer, subject="Help", description=".."
        )

        self.client.force_authenticate(user=self.sales)
        url = reverse('complaint-assign', args=[complaint.id])

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        complaint.refresh_from_db()
        self.assertEqual(complaint.assigned_to, self.sales)
        self.assertEqual(complaint.status, ComplaintStatus.IN_PROGRESS)

    def test_escalation_flow(self):
        """Test Sales -> Manager -> Owner escalation"""
        complaint = Complaint.objects.create(
            order=self.order, created_by=self.user_consumer, subject="Big Issue", description=".."
        )

        self.client.force_authenticate(user=self.sales)
        url = reverse('complaint-escalate', args=[complaint.id])
        response = self.client.post(url)
        self.assertEqual(response.data['level'], EscalationLevel.MANAGER)

        self.client.force_authenticate(user=self.manager)
        response = self.client.post(url)
        self.assertEqual(response.data['level'], EscalationLevel.OWNER)

    def test_export_logs_csv(self):
        """Test CSV Export functionality"""
        Complaint.objects.create(order=self.order, created_by=self.user_consumer, subject="A", description="..")

        self.client.force_authenticate(user=self.owner)
        url = reverse('complaint-export-csv')

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertContains(response, "A")

    def test_complaint_soft_delete(self):
        """Test that deleting a complaint archives it"""
        complaint = Complaint.objects.create(
            order=self.order, created_by=self.user_consumer, subject="Del", description=".."
        )

        self.client.force_authenticate(user=self.user_consumer)
        url = reverse('complaint-detail', args=[complaint.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        complaint.refresh_from_db()
        self.assertFalse(complaint.is_active)


    def test_create_chat_thread_requires_link(self):
        """Test that you cannot start chat without ACCEPTED link"""
        unlinked_supplier = Supplier.objects.create(company_name="No Link Inc", address="..")

        self.client.force_authenticate(user=self.user_consumer)
        data = {"supplier": unlinked_supplier.id}

        response = self.client.post(self.chat_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_chat_thread_success(self):
        """Test successful thread creation between linked parties"""
        self.client.force_authenticate(user=self.user_consumer)
        data = {"supplier": self.supplier.id}

        response = self.client.post(self.chat_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ChatThread.objects.count(), 1)

    def test_send_message_text(self):
        """Test sending a text message"""
        thread = ChatThread.objects.create(consumer=self.consumer, supplier=self.supplier)

        self.client.force_authenticate(user=self.user_consumer)
        # Use the custom nested URL name we defined in urls.py
        url = reverse('chat-messages', args=[thread.id])

        data = {"text": "Hello Supplier"}
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ChatMessage.objects.count(), 1)
        self.assertEqual(ChatMessage.objects.first().text, "Hello Supplier")

    def test_send_message_file(self):
        """Test sending a file attachment"""
        thread = ChatThread.objects.create(consumer=self.consumer, supplier=self.supplier)

        self.client.force_authenticate(user=self.user_consumer)
        url = reverse('chat-messages', args=[thread.id])

        # Mock File
        file = SimpleUploadedFile("test.txt", b"file_content", content_type="text/plain")

        data = {"file": file, "text": "Here is a file"}
        # Format must be multipart
        response = self.client.post(url, data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ChatMessage.objects.first().file)

    def test_chat_read_receipts(self):
        """Test marking messages as read"""
        thread = ChatThread.objects.create(consumer=self.consumer, supplier=self.supplier)
        # Consumer sends message
        msg = ChatMessage.objects.create(thread=thread, sender=self.user_consumer, text="Hi")

        # Supplier marks it read
        self.client.force_authenticate(user=self.sales)
        url = reverse('chat-messages-mark-read', args=[thread.id])  # Uses new URL name

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        msg.refresh_from_db()
        self.assertTrue(msg.is_read)

    def test_chat_escalation(self):
        """Test Sales -> Manager Chat Escalation"""
        thread = ChatThread.objects.create(consumer=self.consumer, supplier=self.supplier)

        self.client.force_authenticate(user=self.sales)
        url = reverse('chat-thread-escalate', args=[thread.id])

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        thread.refresh_from_db()
        self.assertEqual(thread.escalation_level, EscalationLevel.MANAGER)

    def test_chat_thread_soft_delete(self):
        """Test deleting a chat thread archives it"""
        thread = ChatThread.objects.create(consumer=self.consumer, supplier=self.supplier)

        self.client.force_authenticate(user=self.owner)
        url = reverse('chat-thread-detail', args=[thread.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        thread.refresh_from_db()
        self.assertFalse(thread.is_active)

    def test_list_hides_archived_chat_threads(self):
        """Test that the list endpoint filters out soft deleted threads"""
        thread = ChatThread.objects.create(consumer=self.consumer, supplier=self.supplier)

        self.client.force_authenticate(user=self.user_consumer)
        response = self.client.get(self.chat_list_url)
        self.assertEqual(len(response.data), 1)

        thread.is_active = False
        thread.save()

        response = self.client.get(self.chat_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_blocked_consumer_cannot_see_chat_or_send_message(self):
        """
        Test that if a Link is BLOCKED or DELETED, the chat access is revoked.
        """
        link = Link.objects.get(supplier=self.supplier, consumer=self.consumer)
        thread = ChatThread.objects.create(consumer=self.consumer, supplier=self.supplier)

        self.client.force_authenticate(user=self.user_consumer)
        response = self.client.get(self.chat_list_url)
        self.assertEqual(len(response.data), 1)

        link.status = LinkStatus.BLOCKED
        link.save()

        response = self.client.get(self.chat_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # Should be hidden

        url = reverse('chat-messages', args=[thread.id])
        data = {"text": "Please unblock me"}
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue("Link is blocked" in str(response.data['detail']))

        link.status = LinkStatus.ACCEPTED
        link.save()
        response = self.client.get(self.chat_list_url)
        self.assertEqual(len(response.data), 1)

        link.is_active = False
        link.save()

        response = self.client.get(self.chat_list_url)
        self.assertEqual(len(response.data), 0)

    def test_intruder_cannot_access_other_chat_thread(self):
        """Test that Consumer A cannot read messages from Consumer B's thread"""
        other_thread = ChatThread.objects.create(consumer=self.other_consumer_org, supplier=self.supplier)
        ChatMessage.objects.create(thread=other_thread, sender=self.other_consumer, text="Secret")

        self.client.force_authenticate(user=self.user_consumer)

        url = reverse('chat-messages', args=[other_thread.id])
        response = self.client.get(url)

        self.assertEqual(len(response.data), 0)

    def test_consumer_cannot_escalate_chat(self):
        """Test that Consumers cannot trigger chat escalation"""
        thread = ChatThread.objects.create(consumer=self.consumer, supplier=self.supplier)

        self.client.force_authenticate(user=self.user_consumer)
        url = reverse('chat-thread-escalate', args=[thread.id])

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        thread.refresh_from_db()
        # Should stay at SALES_REP
        self.assertEqual(thread.escalation_level, EscalationLevel.SALES_REP)
