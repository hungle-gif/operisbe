"""
E2E Tests for Users Module
Test complete user workflows: registration, login, profile management
"""
import pytest
from django.test import TestCase, Client
from django.urls import reverse
from apps.users.models import User
import json


class UserE2ETestCase(TestCase):
    """End-to-end tests for user workflows"""

    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='admin123',
            full_name='Admin User',
            role='admin',
            is_active=True
        )
        self.customer_user = User.objects.create_user(
            email='customer@test.com',
            password='customer123',
            full_name='Customer User',
            role='customer',
            is_active=True
        )

    def test_user_registration_and_login_flow(self):
        """Test: Register new user -> Login -> Get profile"""
        print("\n[TEST] User Registration and Login Flow")

        # Step 1: Register new user
        print("  [STEP 1] Registering new user...")
        register_data = {
            'email': 'newuser@test.com',
            'password': 'newuser123',
            'full_name': 'New User',
            'role': 'customer'
        }
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201, "Registration should succeed")
        print(f"    Result: {response.status_code} - User registered")

        # Step 2: Login with new credentials
        print("  [STEP 2] Logging in with new credentials...")
        login_data = {
            'email': 'newuser@test.com',
            'password': 'newuser123'
        }
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200, "Login should succeed")
        response_data = response.json()
        self.assertIn('access_token', response_data)
        token = response_data['access_token']
        print(f"    Result: {response.status_code} - Login successful, token received")

        # Step 3: Get user profile with token
        print("  [STEP 3] Fetching user profile...")
        response = self.client.get(
            '/api/users/me',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, 200, "Profile fetch should succeed")
        profile_data = response.json()
        self.assertEqual(profile_data['email'], 'newuser@test.com')
        print(f"    Result: {response.status_code} - Profile fetched: {profile_data['email']}")
        print("  [PASSED] Complete flow successful\n")

    def test_user_profile_update_flow(self):
        """Test: Login -> Update profile -> Verify changes"""
        print("\n[TEST] User Profile Update Flow")

        # Step 1: Login
        print("  [STEP 1] Logging in...")
        login_data = {
            'email': 'customer@test.com',
            'password': 'customer123'
        }
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        token = response.json()['access_token']
        print(f"    Result: {response.status_code} - Logged in")

        # Step 2: Update profile
        print("  [STEP 2] Updating profile...")
        update_data = {
            'full_name': 'Updated Customer Name',
            'phone': '0123456789'
        }
        response = self.client.put(
            '/api/users/me',
            data=json.dumps(update_data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, 200, "Update should succeed")
        print(f"    Result: {response.status_code} - Profile updated")

        # Step 3: Verify changes
        print("  [STEP 3] Verifying changes...")
        response = self.client.get(
            '/api/users/me',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        profile_data = response.json()
        self.assertEqual(profile_data['full_name'], 'Updated Customer Name')
        self.assertEqual(profile_data['phone'], '0123456789')
        print(f"    Result: Changes verified - Name: {profile_data['full_name']}")
        print("  [PASSED] Profile update successful\n")

    def test_admin_user_management_flow(self):
        """Test: Admin login -> List users -> Update user role"""
        print("\n[TEST] Admin User Management Flow")

        # Step 1: Admin login
        print("  [STEP 1] Admin logging in...")
        login_data = {
            'email': 'admin@test.com',
            'password': 'admin123'
        }
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        admin_token = response.json()['access_token']
        print(f"    Result: {response.status_code} - Admin logged in")

        # Step 2: List all users
        print("  [STEP 2] Fetching user list...")
        response = self.client.get(
            '/api/users/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        self.assertEqual(response.status_code, 200, "User list should be accessible")
        users = response.json()
        self.assertGreaterEqual(len(users), 2, "Should have at least 2 users")
        print(f"    Result: {response.status_code} - Found {len(users)} users")

        # Step 3: Update user role
        print("  [STEP 3] Updating user role...")
        user_id = str(self.customer_user.id)
        update_data = {
            'role': 'sales'
        }
        response = self.client.patch(
            f'/api/users/{user_id}',
            data=json.dumps(update_data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}'
        )
        self.assertEqual(response.status_code, 200, "Role update should succeed")
        print(f"    Result: {response.status_code} - User role updated to 'sales'")
        print("  [PASSED] Admin management successful\n")

    def test_invalid_login_flow(self):
        """Test: Invalid credentials should fail"""
        print("\n[TEST] Invalid Login Flow")

        print("  [STEP 1] Attempting login with wrong password...")
        login_data = {
            'email': 'customer@test.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401, "Should fail with 401")
        print(f"    Result: {response.status_code} - Login correctly rejected")
        print("  [PASSED] Security validation working\n")


def run_tests():
    """Run all E2E tests"""
    print("\n" + "="*60)
    print("RUNNING E2E TESTS - USERS MODULE")
    print("="*60)

    import sys
    from django.core.management import call_command

    # Run tests
    result = call_command('test', 'apps.users.tests.test_e2e_users', verbosity=2)

    print("\n" + "="*60)
    print("E2E TESTS COMPLETED")
    print("="*60 + "\n")

    return result


if __name__ == '__main__':
    run_tests()
