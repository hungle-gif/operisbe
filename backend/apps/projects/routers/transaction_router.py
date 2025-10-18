"""
Transaction Management API
Admin manages payments, deposits, and financial transactions
"""
from typing import List
from ninja import Router
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from api.dependencies.current_user import auth_bearer
from apps.projects.models import (
    Project, Proposal, Transaction,
    TransactionType, TransactionStatus
)
from pydantic import BaseModel, Field
from decimal import Decimal

router = Router(tags=['Transaction Management'])


class TransactionCreate(BaseModel):
    """Schema for creating manual transaction"""
    project_id: str
    transaction_type: str = Field(..., description="deposit, phase, refund, adjustment")
    amount: float
    phase_index: int = None
    payment_method: str = "bank_transfer"
    transaction_reference: str = None
    description: str = None


class TransactionOut(BaseModel):
    """Transaction output schema"""
    id: str
    project_id: str
    project_name: str
    customer_name: str
    customer_email: str
    transaction_type: str
    status: str
    amount: float
    phase_index: int = None
    phase_name: str = None
    payment_method: str
    transaction_reference: str = None
    description: str = None
    created_at: str
    completed_at: str = None
    processed_by: dict = None


def serialize_transaction(transaction):
    """Serialize transaction to dict"""
    return {
        'id': str(transaction.id),
        'project_id': str(transaction.project.id),
        'project_name': transaction.project.name,
        'customer_name': transaction.customer.full_name,
        'customer_email': transaction.customer.email,
        'transaction_type': transaction.transaction_type,
        'status': transaction.status,
        'amount': float(transaction.amount),
        'phase_index': transaction.phase_index,
        'phase_name': transaction.phase_name,
        'payment_method': transaction.payment_method,
        'transaction_reference': transaction.transaction_reference,
        'description': transaction.description,
        'created_at': transaction.created_at.isoformat(),
        'completed_at': transaction.completed_at.isoformat() if transaction.completed_at else None,
        'processed_by': {
            'id': str(transaction.processed_by.id),
            'name': transaction.processed_by.full_name
        } if transaction.processed_by else None
    }


@router.get("/transactions", auth=auth_bearer)
def list_transactions(request, status: str = None, project_id: str = None):
    """
    List all transactions with optional filters
    Admin/Sales only
    """
    user = request.auth
    if user.role not in ['admin', 'sales']:
        raise HttpError(403, "Admin/Sales only")

    transactions = Transaction.objects.select_related(
        'project', 'customer', 'processed_by'
    ).all()

    # Apply filters
    if status:
        transactions = transactions.filter(status=status)
    if project_id:
        transactions = transactions.filter(project_id=project_id)

    return [serialize_transaction(t) for t in transactions]


@router.get("/transactions/{transaction_id}", auth=auth_bearer)
def get_transaction(request, transaction_id: str):
    """Get single transaction details"""
    user = request.auth
    transaction = get_object_or_404(Transaction, id=transaction_id)

    # Check permissions
    if user.role == 'customer':
        if transaction.customer != user:
            raise HttpError(403, "Not authorized")

    return serialize_transaction(transaction)


@router.post("/transactions/manual", auth=auth_bearer)
def create_manual_transaction(request, payload: TransactionCreate):
    """
    Create manual transaction (admin only)
    For recording offline payments, refunds, adjustments
    """
    user = request.auth
    if user.role != 'admin':
        raise HttpError(403, "Admin only")

    project = get_object_or_404(Project, id=payload.project_id)

    # Get proposal if exists
    proposal = Proposal.objects.filter(project=project, status='accepted').first()

    # Create transaction
    transaction = Transaction.objects.create(
        project=project,
        proposal=proposal,
        customer=project.customer.user,
        transaction_type=payload.transaction_type,
        status=TransactionStatus.COMPLETED,  # Manual transactions are immediately completed
        amount=Decimal(str(payload.amount)),
        phase_index=payload.phase_index,
        payment_method=payload.payment_method,
        transaction_reference=payload.transaction_reference,
        description=payload.description,
        completed_at=timezone.now(),
        processed_by=user
    )

    return serialize_transaction(transaction)


@router.post("/transactions/{transaction_id}/approve", auth=auth_bearer)
def approve_transaction(request, transaction_id: str):
    """
    Approve pending transaction
    Admin/Sales only
    """
    user = request.auth
    if user.role not in ['admin', 'sales']:
        raise HttpError(403, "Admin/Sales only")

    transaction = get_object_or_404(Transaction, id=transaction_id)

    if transaction.status != TransactionStatus.PENDING:
        raise HttpError(400, f"Transaction is already {transaction.status}")

    transaction.mark_completed(processed_by=user)

    return serialize_transaction(transaction)


@router.post("/transactions/{transaction_id}/reject", auth=auth_bearer)
def reject_transaction(request, transaction_id: str, reason: str = None):
    """
    Reject/cancel pending transaction
    Admin/Sales only
    """
    user = request.auth
    if user.role not in ['admin', 'sales']:
        raise HttpError(403, "Admin/Sales only")

    transaction = get_object_or_404(Transaction, id=transaction_id)

    if transaction.status != TransactionStatus.PENDING:
        raise HttpError(400, f"Transaction is already {transaction.status}")

    transaction.status = TransactionStatus.CANCELLED
    if reason:
        transaction.metadata['cancellation_reason'] = reason
    transaction.processed_by = user
    transaction.save()

    return {"message": "Transaction cancelled", "transaction_id": str(transaction.id)}


@router.get("/projects/{project_id}/transactions", auth=auth_bearer)
def get_project_transactions(request, project_id: str):
    """
    Get all transactions for a specific project
    Shows payment history timeline
    """
    user = request.auth
    project = get_object_or_404(Project, id=project_id)

    # Check permissions
    if user.role == 'customer':
        if project.customer.user != user:
            raise HttpError(403, "Not authorized")

    transactions = Transaction.objects.filter(
        project=project
    ).select_related('customer', 'processed_by').order_by('-created_at')

    return [serialize_transaction(t) for t in transactions]


@router.get("/projects/{project_id}/financial-summary", auth=auth_bearer)
def get_project_financial_summary(request, project_id: str):
    """
    Get complete financial summary for project
    Includes all transactions, phases, deposits
    """
    user = request.auth
    project = get_object_or_404(Project, id=project_id)

    # Check permissions
    if user.role == 'customer':
        if project.customer.user != user:
            raise HttpError(403, "Not authorized")

    # Get proposal
    proposal = Proposal.objects.filter(project=project, status='accepted').first()

    # Get all transactions
    transactions = Transaction.objects.filter(project=project)
    completed_transactions = transactions.filter(status=TransactionStatus.COMPLETED)

    # Calculate totals
    total_received = sum(t.amount for t in completed_transactions if t.transaction_type in ['deposit', 'phase'])
    total_refunded = sum(t.amount for t in completed_transactions if t.transaction_type == 'refund')
    net_received = total_received - total_refunded

    # Phase breakdown
    phase_details = []
    if proposal and proposal.phases:
        for i, phase in enumerate(proposal.phases):
            phase_transactions = transactions.filter(
                transaction_type='phase',
                phase_index=i
            )
            phase_paid = sum(
                t.amount for t in phase_transactions
                if t.status == TransactionStatus.COMPLETED
            )

            phase_details.append({
                'phase_index': i,
                'phase_name': phase.get('name'),
                'phase_amount': float(phase.get('amount', 0)),
                'paid_amount': float(phase_paid),
                'completed': phase.get('completed', False),
                'payment_approved': phase.get('payment_approved', False),
                'transaction_count': phase_transactions.count()
            })

    return {
        'project_id': str(project.id),
        'project_name': project.name,
        'project_status': project.status,
        'customer': {
            'id': str(project.customer.id),
            'name': project.customer.company_name,
            'email': project.customer.user.email
        },
        'financial_summary': {
            'contract_value': float(proposal.total_price) if proposal else 0,
            'total_received': float(total_received),
            'total_refunded': float(total_refunded),
            'net_received': float(net_received),
            'pending_amount': float(proposal.total_price - net_received) if proposal else 0
        },
        'deposit': {
            'amount': float(proposal.deposit_amount) if proposal else 0,
            'paid': proposal.deposit_paid if proposal else False,
            'paid_at': proposal.deposit_paid_at.isoformat() if proposal and proposal.deposit_paid_at else None
        },
        'phases': phase_details,
        'transaction_summary': {
            'total_transactions': transactions.count(),
            'completed': completed_transactions.count(),
            'pending': transactions.filter(status=TransactionStatus.PENDING).count(),
            'failed': transactions.filter(status=TransactionStatus.FAILED).count()
        }
    }
