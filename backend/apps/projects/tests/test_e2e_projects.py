"""
E2E Tests for Projects Module
Test complete project workflow: creation, proposal, payment, completion
"""
import pytest
from django.test import TestCase, Client
from apps.users.models import User
from apps.customers.models import Customer
from apps.projects.models import Project, Proposal, ProjectStatus, ProposalStatus
from apps.services.models import Service
import json
from decimal import Decimal


class ProjectE2ETestCase(TestCase):
    """End-to-end tests for project workflows"""

    def setUp(self):
        self.client = Client()

        # Create users
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='admin123',
            full_name='Admin',
            role='admin'
        )
        self.sale = User.objects.create_user(
            email='sale@test.com',
            password='sale123',
            full_name='Sale User',
            role='sales'
        )
        self.customer_user = User.objects.create_user(
            email='customer@test.com',
            password='customer123',
            full_name='Customer User',
            role='customer'
        )

        # Create customer
        self.customer = Customer.objects.create(
            user=self.customer_user,
            company_name='Test Company',
            phone='0123456789'
        )

        # Create service
        self.service = Service.objects.create(
            name='Web Development',
            description='Custom web application',
            base_price=Decimal('10000000')
        )

        # Get tokens
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'email': 'sale@test.com', 'password': 'sale123'}),
            content_type='application/json'
        )
        self.sale_token = response.json()['access_token']

        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'email': 'customer@test.com', 'password': 'customer123'}),
            content_type='application/json'
        )
        self.customer_token = response.json()['access_token']

    def test_complete_project_lifecycle(self):
        """Test: Create project -> Send proposal -> Accept -> Pay deposit -> Complete phases -> Project completed"""
        print("\n[TEST] Complete Project Lifecycle")

        # Step 1: Sale creates project
        print("  [STEP 1] Sale creates project...")
        project_data = {
            'name': 'E-commerce Website',
            'description': 'Build online shop',
            'customer_id': str(self.customer.id),
            'budget': 15000000,
            'estimated_hours': 200
        }
        response = self.client.post(
            '/api/projects/',
            data=json.dumps(project_data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.sale_token}'
        )
        self.assertEqual(response.status_code, 201)
        project_id = response.json()['id']
        print(f"    Result: {response.status_code} - Project created: {project_id}")

        # Step 2: Sale creates proposal with phases
        print("  [STEP 2] Sale creates proposal...")
        proposal_data = {
            'project_id': project_id,
            'service_id': str(self.service.id),
            'total_price': 15000000,
            'deposit_amount': 5000000,
            'phases': [
                {'name': 'Phase 1', 'description': 'Frontend', 'amount': 5000000, 'duration_days': 30},
                {'name': 'Phase 2', 'description': 'Backend', 'amount': 5000000, 'duration_days': 30}
            ],
            'terms': 'Payment terms...',
            'technical_requirements': 'React, Django...'
        }
        response = self.client.post(
            '/api/proposals/',
            data=json.dumps(proposal_data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.sale_token}'
        )
        self.assertEqual(response.status_code, 201)
        proposal_id = response.json()['id']
        print(f"    Result: {response.status_code} - Proposal created: {proposal_id}")

        # Step 3: Customer accepts proposal
        print("  [STEP 3] Customer accepts proposal...")
        response = self.client.post(
            f'/api/proposals/{proposal_id}/accept',
            HTTP_AUTHORIZATION=f'Bearer {self.customer_token}'
        )
        self.assertEqual(response.status_code, 200)
        print(f"    Result: {response.status_code} - Proposal accepted")

        # Step 4: Customer pays deposit
        print("  [STEP 4] Customer submits deposit payment...")
        response = self.client.post(
            f'/api/proposals/{proposal_id}/submit-payment',
            HTTP_AUTHORIZATION=f'Bearer {self.customer_token}'
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data['deposit_paid'])
        print(f"    Result: {response.status_code} - Deposit paid, project started")

        # Step 5: Sale completes Phase 1
        print("  [STEP 5] Sale marks Phase 1 as completed...")
        response = self.client.post(
            f'/api/proposals/{proposal_id}/phases/0/complete',
            HTTP_AUTHORIZATION=f'Bearer {self.sale_token}'
        )
        self.assertEqual(response.status_code, 200)
        print(f"    Result: {response.status_code} - Phase 1 completed")

        # Step 6: Customer pays Phase 1
        print("  [STEP 6] Customer pays Phase 1...")
        response = self.client.post(
            f'/api/proposals/{proposal_id}/phases/0/submit-payment',
            HTTP_AUTHORIZATION=f'Bearer {self.customer_token}'
        )
        self.assertEqual(response.status_code, 200)
        print(f"    Result: {response.status_code} - Phase 1 paid")

        # Step 7: Sale completes Phase 2
        print("  [STEP 7] Sale marks Phase 2 as completed...")
        response = self.client.post(
            f'/api/proposals/{proposal_id}/phases/1/complete',
            HTTP_AUTHORIZATION=f'Bearer {self.sale_token}'
        )
        self.assertEqual(response.status_code, 200)
        print(f"    Result: {response.status_code} - Phase 2 completed")

        # Step 8: Customer pays Phase 2 (last phase)
        print("  [STEP 8] Customer pays Phase 2 (last phase)...")
        response = self.client.post(
            f'/api/proposals/{proposal_id}/phases/1/submit-payment',
            HTTP_AUTHORIZATION=f'Bearer {self.customer_token}'
        )
        self.assertEqual(response.status_code, 200)
        print(f"    Result: {response.status_code} - Phase 2 paid")

        # Step 9: Verify project is COMPLETED
        print("  [STEP 9] Verifying project status...")
        response = self.client.get(
            f'/api/projects/{project_id}',
            HTTP_AUTHORIZATION=f'Bearer {self.customer_token}'
        )
        project_data = response.json()
        self.assertEqual(project_data['status'], 'completed')
        print(f"    Result: {response.status_code} - Project status: COMPLETED")
        print("  [PASSED] Complete lifecycle successful\n")

    def test_proposal_rejection_flow(self):
        """Test: Create proposal -> Customer rejects -> Sale can edit"""
        print("\n[TEST] Proposal Rejection Flow")

        # Create project
        project_data = {
            'name': 'Mobile App',
            'customer_id': str(self.customer.id),
            'budget': 20000000
        }
        response = self.client.post(
            '/api/projects/',
            data=json.dumps(project_data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.sale_token}'
        )
        project_id = response.json()['id']

        # Create proposal
        print("  [STEP 1] Creating proposal...")
        proposal_data = {
            'project_id': project_id,
            'service_id': str(self.service.id),
            'total_price': 20000000,
            'deposit_amount': 7000000,
            'phases': [],
            'terms': 'Terms...'
        }
        response = self.client.post(
            '/api/proposals/',
            data=json.dumps(proposal_data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.sale_token}'
        )
        proposal_id = response.json()['id']
        print(f"    Result: {response.status_code} - Proposal created")

        # Customer rejects
        print("  [STEP 2] Customer rejects proposal...")
        reject_data = {'rejection_reason': 'Price too high'}
        response = self.client.post(
            f'/api/proposals/{proposal_id}/reject',
            data=json.dumps(reject_data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.customer_token}'
        )
        self.assertEqual(response.status_code, 200)
        print(f"    Result: {response.status_code} - Proposal rejected")

        # Verify status
        print("  [STEP 3] Verifying rejection...")
        response = self.client.get(
            f'/api/proposals/{proposal_id}',
            HTTP_AUTHORIZATION=f'Bearer {self.sale_token}'
        )
        proposal = response.json()
        self.assertEqual(proposal['status'], 'rejected')
        print(f"    Result: Proposal status: REJECTED")
        print("  [PASSED] Rejection flow successful\n")


def run_tests():
    """Run all E2E tests for projects"""
    print("\n" + "="*60)
    print("RUNNING E2E TESTS - PROJECTS MODULE")
    print("="*60)

    from django.core.management import call_command
    call_command('test', 'apps.projects.tests.test_e2e_projects', verbosity=2)

    print("\n" + "="*60)
    print("E2E TESTS COMPLETED")
    print("="*60 + "\n")


if __name__ == '__main__':
    run_tests()
