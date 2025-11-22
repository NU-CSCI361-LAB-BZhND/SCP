from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from companies.models import Supplier, Consumer, Link, LinkStatus
from users.models import UserRole

User = get_user_model()


class LinkTests(APITestCase):
    def setUp(self):
        # 1. Target Supplier
        self.supplier_company = Supplier.objects.create(company_name="Beka Corp", address="123 dasdsad")
        self.supplier_user = User.objects.create_user(
            email="supplier@test.com", password="password123", role=UserRole.OWNER
        )
        self.supplier_user.supplier = self.supplier_company
        self.supplier_user.save()

        # 2. Requester Consumer
        self.consumer_company = Consumer.objects.create(company_name="Clueless Corp", address="456 gagadsgda")
        self.consumer_user = User.objects.create_user(
            email="hotel@test.com", password="password123", role=UserRole.CONSUMER
        )
        self.consumer_user.consumer = self.consumer_company
        self.consumer_user.save()

        # 3. Intruder Supplier
        self.intruder_company = Supplier.objects.create(company_name="Evil Corp", address="666 Proklyatye")
        self.intruder_user = User.objects.create_user(
            email="hacker@test.com", password="password123", role=UserRole.OWNER
        )
        self.intruder_user.supplier = self.intruder_company
        self.intruder_user.save()

        self.list_url = reverse('link-list')


    def test_consumer_can_request_link(self):
        """Test that a valid consumer can successfully request a link"""
        self.client.force_authenticate(user=self.consumer_user)

        data = {"supplier": self.supplier_company.id}
        response = self.client.post(self.list_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], LinkStatus.PENDING)
        self.assertEqual(Link.objects.count(), 1)

    def test_supplier_can_approve_link(self):
        """Test that a supplier can accept a pending link"""
        link = Link.objects.create(
            supplier=self.supplier_company, consumer=self.consumer_company, status=LinkStatus.PENDING
        )

        self.client.force_authenticate(user=self.supplier_user)
        url = reverse('link-detail', args=[link.id])

        response = self.client.patch(url, {"status": LinkStatus.ACCEPTED})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], LinkStatus.ACCEPTED)

    def test_supplier_can_block_link(self):
        """Test that a supplier can block a consumer"""
        link = Link.objects.create(
            supplier=self.supplier_company, consumer=self.consumer_company, status=LinkStatus.PENDING
        )

        self.client.force_authenticate(user=self.supplier_user)
        url = reverse('link-detail', args=[link.id])

        response = self.client.patch(url, {"status": LinkStatus.BLOCKED})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], LinkStatus.BLOCKED)

    def test_consumer_can_cancel_request(self):
        """Test that a consumer can delete/cancel their own pending request"""
        link = Link.objects.create(
            supplier=self.supplier_company, consumer=self.consumer_company, status=LinkStatus.PENDING
        )

        self.client.force_authenticate(user=self.consumer_user)
        url = reverse('link-detail', args=[link.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Link.objects.count(), 0)


    def test_create_link_ignores_status_input(self):
        """Test that Consumer cannot force ACCEPTED status during creation"""
        self.client.force_authenticate(user=self.consumer_user)

        data = {
            "supplier": self.supplier_company.id,
            "status": LinkStatus.ACCEPTED
        }
        response = self.client.post(self.list_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # The API should ignore the input and default to PENDING
        self.assertEqual(response.data['status'], LinkStatus.PENDING)

    def test_intruder_cannot_manage_others_link(self):
        """Test that Supplier B cannot approve a link sent to Supplier A"""
        link = Link.objects.create(
            supplier=self.supplier_company, consumer=self.consumer_company, status=LinkStatus.PENDING
        )

        # Login as Intruder
        self.client.force_authenticate(user=self.intruder_user)
        url = reverse('link-detail', args=[link.id])

        # Try to approve it
        response = self.client.patch(url, {"status": LinkStatus.ACCEPTED})

        # Should be 404
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Verify DB didn't change
        link.refresh_from_db()
        self.assertEqual(link.status, LinkStatus.PENDING)

    def test_duplicate_link_prevention(self):
        """Test that a consumer cannot request the same supplier twice"""
        self.client.force_authenticate(user=self.consumer_user)
        Link.objects.create(supplier=self.supplier_company, consumer=self.consumer_company)

        response = self.client.post(self.list_url, {"supplier": self.supplier_company.id})
        self.assertEqual(response.status_code,
                         status.HTTP_400_BAD_REQUEST)

    def test_supplier_cannot_request_link(self):
        """Test that suppliers cannot initiate link requests"""
        self.client.force_authenticate(user=self.supplier_user)
        response = self.client.post(self.list_url, {"supplier": self.supplier_company.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)