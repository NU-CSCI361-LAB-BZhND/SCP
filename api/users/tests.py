from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from companies.models import Supplier, Consumer
from users.models import UserRole

User = get_user_model()


class UserAuthTests(APITestCase):
    def setUp(self):
        # Endpoints
        self.register_url = reverse('register')
        self.login_url = reverse('token_obtain_pair')
        self.staff_list_url = reverse('staff-list')
        self.delete_account_url = reverse('delete-account')
        self.me_url = reverse('me')  # /api/auth/me/

        self.supplier_data = {
            "email": "owner@supplier.com",
            "password": "strongpassword123",
            "role": "OWNER",
            "company_name": "Mega Beka Corp",
            "company_address": "123 adsas"
        }

        self.consumer_data = {
            "email": "ceo@hotel.com",
            "password": "strongpassword123",
            "role": "CONSUMER",
            "company_name": "Beka's Hotel",
            "company_address": "456 gagadsgd"
        }

    def test_register_supplier_success(self):
        """Test that an Owner can register and a Supplier company is created."""
        response = self.client.post(self.register_url, self.supplier_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], self.supplier_data['email'])

        user = User.objects.get(email=self.supplier_data['email'])
        self.assertTrue(user.check_password(self.supplier_data['password']))

        self.assertIsNotNone(user.supplier)
        self.assertEqual(user.supplier.company_name, "Mega Beka Corp")
        self.assertEqual(Supplier.objects.count(), 1)

    def test_register_consumer_success(self):
        """Test that a Consumer can register and a Consumer company is created."""
        response = self.client.post(self.register_url, self.consumer_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email=self.consumer_data['email'])
        self.assertIsNotNone(user.consumer)
        self.assertEqual(user.consumer.company_name, "Beka's Hotel")
        self.assertEqual(Consumer.objects.count(), 1)

    def test_register_duplicate_email(self):
        """Test that registering with an existing email fails."""
        self.client.post(self.register_url, self.supplier_data)

        data = self.supplier_data.copy()
        data['company_name'] = "Different Company"

        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_duplicate_company_name(self):
        """Test that two owners cannot register the exact same Company Name."""
        self.client.post(self.register_url, self.supplier_data)

        data = self.supplier_data.copy()
        data['email'] = "other@supplier.com"

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('company_name', response.data)

    def test_register_duplicate_company_name_consumer(self):
        """Test that two consumers cannot register the exact same Company Name."""
        self.client.post(self.register_url, self.consumer_data)

        data = self.consumer_data.copy()
        data['email'] = "ceo@restauranat.com"

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('company_name', response.data)

    def test_register_restricted_role(self):
        """Test that users cannot register as MANAGER or SALES_REP publicly."""
        data = self.supplier_data.copy()
        data['role'] = "MANAGER"

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue("Managers" in str(response.data) or "role" in response.data)

    def test_login_and_access_protected_route(self):
        """Test the full flow: Register -> Login -> Access Protected Endpoint"""
        self.client.post(self.register_url, self.supplier_data)

        login_data = {
            "email": self.supplier_data['email'],
            "password": self.supplier_data['password']
        }
        login_response = self.client.post(self.login_url, login_data)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        token = login_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        me_response = self.client.get(self.me_url)

        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['email'], self.supplier_data['email'])

        self.assertEqual(me_response.data['company_name'], "Mega Beka Corp")

    def test_access_protected_route_without_token(self):
        """Test that protected endpoints return 401 for anonymous users."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_with_bad_token(self):
        """Test that invalid tokens are rejected."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer bad_token_string')
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_missing_fields(self):
        """Test that required fields (like role or company_name) are enforced."""
        incomplete_data = {"email": "fail@test.com", "password": "123"}
        response = self.client.post(self.register_url, incomplete_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_create_manager(self):
        """Test Owner creating a Manager via Staff API"""

        self.client.post(self.register_url, self.supplier_data)
        owner_user = User.objects.get(email=self.supplier_data['email'])
        self.client.force_authenticate(user=owner_user)

        data = {
            "email": "new_manager@mega.com",
            "password": "pass",
            "first_name": "Big",
            "last_name": "Boss",
            "role": UserRole.MANAGER
        }
        data2 = {
            "email": "new_sales@mega.com",
            "password": "pass",
            "first_name": "Big",
            "last_name": "Boss",
            "role": UserRole.SALES_REP
        }
        response = self.client.post(self.staff_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response2 = self.client.post(self.staff_list_url, data2)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_user = User.objects.get(email="new_manager@mega.com")
        self.assertEqual(new_user.supplier, owner_user.supplier)
        self.assertEqual(new_user.role, UserRole.MANAGER)
        new_sales = User.objects.get(email="new_sales@mega.com")
        self.assertEqual(new_sales.supplier, owner_user.supplier)
        self.assertEqual(new_sales.role, UserRole.SALES_REP)

    def test_manager_cannot_create_manager(self):
        """Test Hierarchy: Manager cannot create another Manager"""

        self.client.post(self.register_url, self.supplier_data)
        owner = User.objects.get(email=self.supplier_data['email'])

        manager = User.objects.create_user(
            email="manager@test.com", password="password", role=UserRole.MANAGER
        )
        manager.supplier = owner.supplier
        manager.save()

        self.client.force_authenticate(user=manager)

        data = {
            "email": "rival_manager@mega.com",
            "password": "pass",
            "role": UserRole.MANAGER
        }
        response = self.client.post(self.staff_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_manager_can_create_sales_rep(self):
        """Test Hierarchy: Manager can create Sales Rep"""
        self.client.post(self.register_url, self.supplier_data)
        owner = User.objects.get(email=self.supplier_data['email'])

        manager = User.objects.create_user(
            email="manager@test.com", password="password", role=UserRole.MANAGER
        )
        manager.supplier = owner.supplier
        manager.save()

        self.client.force_authenticate(user=manager)

        data = {
            "email": "sales_rep@mega.com",
            "password": "pass",
            "role": UserRole.SALES_REP
        }
        response = self.client.post(self.staff_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email="sales_rep@mega.com")
        self.assertEqual(new_user.supplier, owner.supplier)
        self.assertEqual(new_user.supplier, manager.supplier)
        self.assertEqual(new_user.role, UserRole.SALES_REP)

    def test_sales_rep_cannot_create_staff(self):
        """Test that Sales Reps are denied access to Staff API"""

        self.client.post(self.register_url, self.supplier_data)
        owner = User.objects.get(email=self.supplier_data['email'])

        sales_rep = User.objects.create_user(
            email="sales@test.com", password="password", role=UserRole.SALES_REP
        )
        sales_rep.supplier = owner.supplier
        sales_rep.save()

        # 3. Login as Sales Rep
        self.client.force_authenticate(user=sales_rep)

        response = self.client.get(self.staff_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_soft_delete_staff(self):
        """Test that deleting staff marks them inactive (Soft Delete)"""

        self.client.post(self.register_url, self.supplier_data)
        owner = User.objects.get(email=self.supplier_data['email'])
        self.client.force_authenticate(user=owner)

        staff_data = {
            "email": "tobe_deleted@test.com",
            "password": "pass",
            "role": UserRole.SALES_REP
        }
        create_resp = self.client.post(self.staff_list_url, staff_data)
        staff_id = create_resp.data['id']

        url = reverse('staff-detail', args=[staff_id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # 4. Verify Soft Delete
        staff_user = User.objects.get(pk=staff_id)
        self.assertFalse(staff_user.is_active)
        self.assertIsNotNone(staff_user.pk)  # Should still exist in DB

    def test_owner_delete_account_cascades_soft_delete(self):
        """
        Test UC6: Owner deletes account.
        Expect: Supplier, Owner, and ALL Staff to be deactivated (is_active=False).
        """

        self.client.post(self.register_url, self.supplier_data)
        owner = User.objects.get(email=self.supplier_data['email'])
        company = owner.supplier
        self.client.force_authenticate(user=owner)

        User.objects.create_user(
            email="staff1@test.com", password="p", role=UserRole.MANAGER, supplier=company
        )

        User.objects.create_user(
            email="staff2@test.com", password="p", role=UserRole.SALES_REP, supplier=company
        )

        response = self.client.delete(self.delete_account_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        company.refresh_from_db()
        self.assertFalse(company.is_active)

        owner.refresh_from_db()
        self.assertFalse(owner.is_active)

        staff = User.objects.get(email="staff1@test.com")
        self.assertFalse(staff.is_active)

        staff2 = User .objects.get(email="staff2@test.com")
        self.assertFalse(staff2.is_active)