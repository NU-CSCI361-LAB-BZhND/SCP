from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from companies.models import Supplier, Consumer

User = get_user_model()


class UserAuthTests(APITestCase):
    def setUp(self):
        # Endpoints
        self.register_url = reverse('register')
        self.login_url = reverse('token_obtain_pair')
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