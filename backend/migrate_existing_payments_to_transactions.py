"""
Migration Script: Create Transaction records for existing payments
This script creates Transaction records for all deposits and phase payments
that were made before the Transaction system was implemented.

Run with: python manage.py shell < migrate_existing_payments_to_transactions.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from apps.projects.models import (
    Proposal,
    Transaction,
    TransactionType,
    TransactionStatus
)
from django.utils import timezone
from decimal import Decimal

def migrate_existing_payments():
    """
    Create Transaction records for:
    1. All paid deposits (where deposit_paid = True)
    2. All paid phases (where payment_approved = True)
    """

    print("=" * 80)
    print("MIGRATION: Creating Transaction records for existing payments")
    print("=" * 80)

    # Statistics
    stats = {
        'deposits_migrated': 0,
        'phases_migrated': 0,
        'deposits_skipped': 0,
        'phases_skipped': 0,
        'errors': 0
    }

    # Get all accepted proposals
    proposals = Proposal.objects.filter(status='accepted').select_related(
        'project', 'project__customer', 'project__customer__user'
    )

    print(f"\nFound {proposals.count()} accepted proposals to check\n")

    for proposal in proposals:
        project = proposal.project
        customer = project.customer

        if not customer or not customer.user:
            print(f"⚠️  Skipping proposal {proposal.id} - no customer user")
            continue

        print(f"\n📋 Processing Proposal: {proposal.id}")
        print(f"   Project: {project.name} ({project.id})")
        print(f"   Customer: {customer.company_name}")

        # ============ MIGRATE DEPOSIT PAYMENT ============
        if proposal.deposit_paid:
            print(f"   💰 Deposit paid: {proposal.deposit_amount} VND")

            # Check if transaction already exists
            existing_deposit = Transaction.objects.filter(
                project=project,
                proposal=proposal,
                transaction_type=TransactionType.DEPOSIT
            ).first()

            if existing_deposit:
                print(f"   ✓ Deposit transaction already exists (ID: {existing_deposit.id})")
                stats['deposits_skipped'] += 1
            else:
                try:
                    # Create deposit transaction
                    deposit_transaction = Transaction.objects.create(
                        project=project,
                        proposal=proposal,
                        customer=customer.user,
                        transaction_type=TransactionType.DEPOSIT,
                        status=TransactionStatus.COMPLETED,
                        amount=Decimal(str(proposal.deposit_amount)),
                        payment_method='bank_transfer',
                        description='Migrated: Deposit payment from legacy system',
                        completed_at=proposal.deposit_paid_at or timezone.now(),
                        created_at=proposal.deposit_paid_at or timezone.now(),
                        metadata={
                            'migrated': True,
                            'migration_date': timezone.now().isoformat(),
                            'original_deposit_paid_at': proposal.deposit_paid_at.isoformat() if proposal.deposit_paid_at else None,
                            'payment_proof': proposal.payment_proof if proposal.payment_proof else {}
                        }
                    )
                    print(f"   ✅ Created deposit transaction (ID: {deposit_transaction.id})")
                    stats['deposits_migrated'] += 1
                except Exception as e:
                    print(f"   ❌ Error creating deposit transaction: {e}")
                    stats['errors'] += 1
        else:
            print(f"   ⏳ Deposit not paid yet")

        # ============ MIGRATE PHASE PAYMENTS ============
        if proposal.phases:
            print(f"   📊 Checking {len(proposal.phases)} phases...")

            for phase_index, phase in enumerate(proposal.phases):
                phase_name = phase.get('name', f'Phase {phase_index + 1}')
                phase_amount = Decimal(str(phase.get('amount', 0)))

                if phase.get('payment_approved'):
                    print(f"   💵 Phase {phase_index + 1} ({phase_name}): {phase_amount} VND - PAID")

                    # Check if transaction already exists
                    existing_phase = Transaction.objects.filter(
                        project=project,
                        proposal=proposal,
                        transaction_type=TransactionType.PHASE,
                        phase_index=phase_index
                    ).first()

                    if existing_phase:
                        print(f"      ✓ Phase transaction already exists (ID: {existing_phase.id})")
                        stats['phases_skipped'] += 1
                    else:
                        try:
                            # Get payment approved date from phase
                            payment_approved_at = None
                            if phase.get('payment_approved_at'):
                                try:
                                    from datetime import datetime
                                    payment_approved_at = datetime.fromisoformat(
                                        phase['payment_approved_at'].replace('Z', '+00:00')
                                    )
                                except:
                                    payment_approved_at = timezone.now()
                            else:
                                payment_approved_at = timezone.now()

                            # Create phase transaction
                            phase_transaction = Transaction.objects.create(
                                project=project,
                                proposal=proposal,
                                customer=customer.user,
                                transaction_type=TransactionType.PHASE,
                                status=TransactionStatus.COMPLETED,
                                amount=phase_amount,
                                phase_index=phase_index,
                                phase_name=phase_name,
                                payment_method='bank_transfer',
                                description=f'Migrated: Phase {phase_index + 1} payment from legacy system',
                                completed_at=payment_approved_at,
                                created_at=payment_approved_at,
                                metadata={
                                    'migrated': True,
                                    'migration_date': timezone.now().isoformat(),
                                    'phase_data': phase,
                                    'original_payment_approved_at': phase.get('payment_approved_at')
                                }
                            )
                            print(f"      ✅ Created phase transaction (ID: {phase_transaction.id})")
                            stats['phases_migrated'] += 1
                        except Exception as e:
                            print(f"      ❌ Error creating phase transaction: {e}")
                            stats['errors'] += 1
                else:
                    print(f"   ⏳ Phase {phase_index + 1} ({phase_name}): Not paid yet")

    # ============ PRINT SUMMARY ============
    print("\n" + "=" * 80)
    print("MIGRATION SUMMARY")
    print("=" * 80)
    print(f"✅ Deposits migrated:    {stats['deposits_migrated']}")
    print(f"✅ Phases migrated:      {stats['phases_migrated']}")
    print(f"⏭️  Deposits skipped:     {stats['deposits_skipped']} (already exist)")
    print(f"⏭️  Phases skipped:       {stats['phases_skipped']} (already exist)")
    print(f"❌ Errors:               {stats['errors']}")
    print(f"\n📊 Total transactions created: {stats['deposits_migrated'] + stats['phases_migrated']}")
    print("=" * 80)

    # Verify
    total_transactions = Transaction.objects.count()
    print(f"\n🔍 Total transactions in database: {total_transactions}")
    print(f"   - Deposits: {Transaction.objects.filter(transaction_type=TransactionType.DEPOSIT).count()}")
    print(f"   - Phases:   {Transaction.objects.filter(transaction_type=TransactionType.PHASE).count()}")
    print(f"   - Completed: {Transaction.objects.filter(status=TransactionStatus.COMPLETED).count()}")
    print(f"   - Pending:   {Transaction.objects.filter(status=TransactionStatus.PENDING).count()}")

    return stats

if __name__ == '__main__':
    try:
        stats = migrate_existing_payments()
        print("\n✅ Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed with error: {e}")
        import traceback
        traceback.print_exc()
