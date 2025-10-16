"""
Script to reset proposal for payment testing
Run: docker exec operis_backend python reset_proposal_for_payment_test.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.projects.models import Proposal
from django.utils import timezone

def reset_proposal_for_payment():
    """Reset first proposal to ready-for-payment state"""
    try:
        proposal = Proposal.objects.first()
        if not proposal:
            print('❌ No proposal found in database')
            return

        # Set status to accepted (required for payment)
        proposal.status = 'accepted'
        proposal.accepted_at = timezone.now()

        # Reset payment flags
        proposal.deposit_paid = False
        proposal.payment_submitted = False
        proposal.deposit_paid_at = None
        proposal.payment_submitted_at = None

        # Set all customer approvals to True
        proposal.customer_approvals = {
            'analysis': True,
            'deposit': True,
            'phases': True,
            'team': True,
            'commitments': True
        }

        proposal.save()

        print('✅ Proposal reset successfully!')
        print(f'   ID: {proposal.id}')
        print(f'   Status: {proposal.status}')
        print(f'   Deposit Amount: {proposal.deposit_amount}')
        print(f'   All Approvals: True')
        print(f'   Ready for payment test!')

    except Exception as e:
        print(f'❌ Error: {str(e)}')

if __name__ == '__main__':
    reset_proposal_for_payment()
