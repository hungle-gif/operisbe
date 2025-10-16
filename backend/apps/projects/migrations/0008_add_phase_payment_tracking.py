# Generated migration for adding phase payment tracking fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0007_proposal_payment_proof_proposal_payment_submitted_and_more'),
    ]

    operations = [
        # No actual schema changes needed - we'll use the existing JSONField 'phases'
        # But we'll update the structure to include payment tracking fields:
        #
        # Each phase will have this structure:
        # {
        #     "name": "Giai đoạn 1",
        #     "days": 10,
        #     "amount": 10000000,
        #     "payment_percentage": 100,
        #     "tasks": "...",
        #
        #     # NEW FIELDS for payment tracking:
        #     "completed": false,                    # Sale marks as completed
        #     "completed_at": null,                  # Timestamp when sale marks complete
        #     "completed_by": null,                  # User ID who marked complete
        #     "payment_submitted": false,            # Customer submits payment
        #     "payment_submitted_at": null,          # Timestamp
        #     "payment_approved": false,             # Admin approves payment
        #     "payment_approved_at": null,           # Timestamp
        #     "payment_approved_by": null,           # User ID who approved
        #     "payment_proof": {}                    # SePay transaction data
        # }

        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
