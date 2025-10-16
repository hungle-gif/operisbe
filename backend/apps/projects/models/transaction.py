"""
Transaction Model
Track all payment transactions for deposits and phases
"""
import uuid
from django.db import models
from django.utils import timezone
from decimal import Decimal


class TransactionType(models.TextChoices):
    DEPOSIT = 'deposit', 'Deposit Payment'
    PHASE = 'phase', 'Phase Payment'
    REFUND = 'refund', 'Refund'
    ADJUSTMENT = 'adjustment', 'Adjustment'


class TransactionStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'


class Transaction(models.Model):
    """
    Transaction record for all payments
    Tracks deposits, phase payments, refunds, adjustments
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationships
    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    proposal = models.ForeignKey(
        'Proposal',
        on_delete=models.CASCADE,
        related_name='transactions',
        null=True,
        blank=True
    )
    customer = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='transactions'
    )

    # Transaction details
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
        default=TransactionType.DEPOSIT
    )
    status = models.CharField(
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.PENDING
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        help_text="Transaction amount in VND"
    )

    # Phase reference (if applicable)
    phase_index = models.IntegerField(
        null=True,
        blank=True,
        help_text="Phase number if this is a phase payment"
    )
    phase_name = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    # Payment details
    payment_method = models.CharField(
        max_length=50,
        default='bank_transfer',
        help_text="Payment method: bank_transfer, cash, etc"
    )
    transaction_reference = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Bank transaction reference or receipt number"
    )

    # Notes and metadata
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Transaction description or notes"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional transaction data"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When transaction was completed"
    )

    # Admin tracking
    processed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_transactions',
        help_text="Admin/Sales who processed this transaction"
    )

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['customer', 'created_at']),
            models.Index(fields=['transaction_type', 'status']),
        ]

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.amount} VND - {self.status}"

    def mark_completed(self, processed_by=None):
        """Mark transaction as completed"""
        self.status = TransactionStatus.COMPLETED
        self.completed_at = timezone.now()
        if processed_by:
            self.processed_by = processed_by
        self.save()

    def mark_failed(self, reason=None):
        """Mark transaction as failed"""
        self.status = TransactionStatus.FAILED
        if reason:
            self.metadata['failure_reason'] = reason
        self.save()

    @property
    def is_completed(self):
        return self.status == TransactionStatus.COMPLETED

    @property
    def is_pending(self):
        return self.status == TransactionStatus.PENDING
