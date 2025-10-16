# Transaction Management System Guide

## Overview

The Transaction Management System provides complete financial tracking and payment management for projects. This includes deposits, phase payments, refunds, and adjustments.

## Features

### 1. Transaction Model

**Location:** `backend/apps/projects/models/transaction.py`

**Transaction Types:**
- `deposit` - Initial deposit payment
- `phase` - Phase milestone payment
- `refund` - Refund to customer
- `adjustment` - Financial adjustment

**Transaction Status:**
- `pending` - Waiting for approval
- `completed` - Successfully completed
- `failed` - Failed transaction
- `cancelled` - Cancelled/rejected

**Key Fields:**
- `project` - Associated project
- `customer` - Customer who made payment
- `amount` - Transaction amount in VND (Decimal)
- `phase_index` - Phase number (if applicable)
- `payment_method` - Payment method (bank_transfer, cash, etc.)
- `transaction_reference` - Bank reference or receipt number
- `processed_by` - Admin who processed the transaction
- `metadata` - Additional JSON data

## Backend API Endpoints

### Transaction Management API

**Base URL:** `/api/transactions/`

#### 1. List All Transactions
```
GET /transactions/transactions
```

**Query Parameters:**
- `status` (optional) - Filter by status: pending, completed, failed, cancelled
- `project_id` (optional) - Filter by project UUID

**Response:**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "project_name": "Website Development",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "transaction_type": "deposit",
    "status": "completed",
    "amount": 10000000,
    "phase_index": null,
    "phase_name": null,
    "payment_method": "bank_transfer",
    "transaction_reference": "TXN123456",
    "description": "Initial deposit",
    "created_at": "2025-01-15T10:00:00Z",
    "completed_at": "2025-01-15T10:30:00Z",
    "processed_by": {
      "id": "uuid",
      "name": "Admin User"
    }
  }
]
```

#### 2. Get Single Transaction
```
GET /transactions/transactions/{transaction_id}
```

**Response:** Same as list item above

#### 3. Create Manual Transaction (Admin Only)
```
POST /transactions/transactions/manual
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "transaction_type": "deposit",
  "amount": 10000000,
  "phase_index": null,
  "payment_method": "bank_transfer",
  "transaction_reference": "TXN123456",
  "description": "Manual deposit entry"
}
```

**Response:** Created transaction object

**Notes:**
- Manual transactions are immediately marked as `completed`
- Admin only - requires admin role
- Used for recording offline payments

#### 4. Approve Pending Transaction
```
POST /transactions/transactions/{transaction_id}/approve
```

**Response:** Updated transaction object

**Notes:**
- Only works on `pending` transactions
- Admin/Sales only
- Marks transaction as `completed` and sets `completed_at`

#### 5. Reject/Cancel Transaction
```
POST /transactions/transactions/{transaction_id}/reject?reason=Duplicate payment
```

**Query Parameters:**
- `reason` (optional) - Reason for rejection

**Response:**
```json
{
  "message": "Transaction cancelled",
  "transaction_id": "uuid"
}
```

**Notes:**
- Only works on `pending` transactions
- Admin/Sales only
- Reason stored in `metadata.cancellation_reason`

#### 6. Get Project Transactions
```
GET /transactions/projects/{project_id}/transactions
```

**Response:** Array of transaction objects for the project

**Notes:**
- Returns all transactions ordered by created_at (newest first)
- Customer can only see their own project transactions
- Admin/Sales can see all project transactions

#### 7. Get Project Financial Summary
```
GET /transactions/projects/{project_id}/financial-summary
```

**Response:**
```json
{
  "project_id": "uuid",
  "project_name": "Website Development",
  "project_status": "in_progress",
  "customer": {
    "id": "uuid",
    "name": "Company Name",
    "email": "contact@company.com"
  },
  "financial_summary": {
    "contract_value": 50000000,
    "total_received": 30000000,
    "total_refunded": 0,
    "net_received": 30000000,
    "pending_amount": 20000000
  },
  "deposit": {
    "amount": 10000000,
    "paid": true,
    "paid_at": "2025-01-15T10:00:00Z"
  },
  "phases": [
    {
      "phase_index": 0,
      "phase_name": "Design Phase",
      "phase_amount": 20000000,
      "paid_amount": 20000000,
      "completed": true,
      "payment_approved": true,
      "transaction_count": 2
    },
    {
      "phase_index": 1,
      "phase_name": "Development Phase",
      "phase_amount": 20000000,
      "paid_amount": 0,
      "completed": false,
      "payment_approved": false,
      "transaction_count": 0
    }
  ],
  "transaction_summary": {
    "total_transactions": 3,
    "completed": 2,
    "pending": 1,
    "failed": 0
  }
}
```

**Notes:**
- Comprehensive financial overview for a project
- Includes deposit status, phase breakdown, and transaction statistics
- Customer can only see their own projects
- Admin/Sales can see all projects

## Frontend Pages

### 1. Admin Transactions List Page

**URL:** `/dashboard/admin/transactions`

**Features:**
- View all transactions across all projects
- Filter by status and project ID
- Create manual transaction (offline payment recording)
- Approve/reject pending transactions
- View transaction details

**Access:** Admin only

**Key Components:**
- Transaction table with filters
- Status and type badges
- Create transaction modal
- Approve/Reject action buttons

### 2. Per-Project Finance Management Page

**URL:** `/dashboard/admin/projects/{id}/finance`

**Features:**
- Complete financial overview for a single project
- Summary cards: Contract value, Total received, Refunded, Pending
- Deposit status display
- Phase-by-phase breakdown with progress bars
- Transaction history for the project
- Record new payment for the project

**Access:** Admin/Sales

**Key Components:**
- Financial summary cards (gradient backgrounds)
- Deposit status badge
- Phase breakdown with progress bars
- Transaction history table
- Payment recording modal

## Usage Examples

### Example 1: Recording an Offline Payment

**Scenario:** Customer paid deposit via bank transfer, need to record in system

**Steps:**
1. Admin logs in and goes to `/dashboard/admin/transactions`
2. Click "Tạo Giao Dịch Thủ Công" (Create Manual Transaction)
3. Fill in form:
   - Project ID: Copy from project page
   - Transaction Type: Đặt cọc (deposit)
   - Amount: 10000000 (VND)
   - Payment Method: Chuyển khoản (bank_transfer)
   - Transaction Reference: Bank transaction code
   - Description: "Deposit via bank transfer"
4. Click "Tạo Giao Dịch"
5. Transaction is created with status `completed`
6. Project deposit is automatically marked as paid

### Example 2: Recording Phase Payment

**Scenario:** Customer completed phase 1 payment

**Steps:**
1. Admin goes to project finance page: `/dashboard/admin/projects/{id}/finance`
2. Click "Ghi Nhận Thanh Toán" (Record Payment)
3. Select:
   - Transaction Type: Thanh toán giai đoạn (phase)
   - Amount: Phase amount
   - Phase: Select phase from dropdown
   - Payment Method: Select method
   - Transaction Reference: Bank code
4. Click "Ghi Nhận Thanh Toán"
5. Transaction is created
6. Phase is marked as paid
7. If all phases are paid, project auto-completes

### Example 3: Processing Refund

**Scenario:** Need to refund customer due to project cancellation

**Steps:**
1. Go to `/dashboard/admin/transactions`
2. Create manual transaction:
   - Project ID: Project UUID
   - Transaction Type: Hoàn tiền (refund)
   - Amount: Refund amount (negative implied)
   - Description: Reason for refund
3. Transaction is recorded
4. Financial summary reflects the refund

### Example 4: Viewing Project Financial Status

**Scenario:** Check payment status of a project

**Steps:**
1. Go to `/dashboard/admin/projects/{id}/finance`
2. View summary cards:
   - Contract value
   - Total received
   - Total refunded
   - Pending amount
3. Check deposit status
4. Review phase-by-phase breakdown:
   - Each phase shows: value, paid amount, remaining
   - Progress bars visualize completion
5. Scroll down to see complete transaction history

## Integration with Existing System

### Automatic Transaction Creation

The system can be extended to automatically create transactions when:

1. **Customer pays deposit online:**
   - Create transaction with status `pending`
   - Admin approves → becomes `completed`
   - Proposal.deposit_paid updates automatically

2. **Customer pays phase online:**
   - Create transaction with status `pending`
   - Admin approves → becomes `completed`
   - Phase payment_approved updates automatically

### Migration Notes

**For existing projects with payments:**
- Old payments don't have Transaction records
- System still works using Proposal deposit_paid and phase payment_approved fields
- Consider creating migration script to backfill Transaction records

**Recommended migration script:**
```python
# Create transactions for existing paid deposits and phases
from apps.projects.models import Proposal, Transaction, TransactionType, TransactionStatus
from django.utils import timezone

for proposal in Proposal.objects.filter(deposit_paid=True):
    # Create deposit transaction if doesn't exist
    if not Transaction.objects.filter(
        project=proposal.project,
        transaction_type=TransactionType.DEPOSIT
    ).exists():
        Transaction.objects.create(
            project=proposal.project,
            proposal=proposal,
            customer=proposal.project.customer.user,
            transaction_type=TransactionType.DEPOSIT,
            status=TransactionStatus.COMPLETED,
            amount=proposal.deposit_amount,
            payment_method='bank_transfer',
            description='Migrated from existing deposit',
            completed_at=proposal.deposit_paid_at or timezone.now()
        )

    # Create phase transactions
    if proposal.phases:
        for i, phase in enumerate(proposal.phases):
            if phase.get('payment_approved'):
                if not Transaction.objects.filter(
                    project=proposal.project,
                    transaction_type=TransactionType.PHASE,
                    phase_index=i
                ).exists():
                    Transaction.objects.create(
                        project=proposal.project,
                        proposal=proposal,
                        customer=proposal.project.customer.user,
                        transaction_type=TransactionType.PHASE,
                        status=TransactionStatus.COMPLETED,
                        amount=phase.get('amount'),
                        phase_index=i,
                        phase_name=phase.get('name'),
                        payment_method='bank_transfer',
                        description='Migrated from existing phase payment',
                        completed_at=timezone.now()
                    )
```

## Database Schema

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    proposal_id UUID REFERENCES proposals(id) NULL,
    customer_id UUID REFERENCES users(id),
    transaction_type VARCHAR(20), -- deposit, phase, refund, adjustment
    status VARCHAR(20), -- pending, completed, failed, cancelled
    amount DECIMAL(12, 0), -- VND, no decimal places
    phase_index INTEGER NULL,
    phase_name VARCHAR(255) NULL,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255) NULL,
    description TEXT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    completed_at TIMESTAMP NULL,
    processed_by_id UUID REFERENCES users(id) NULL
);

CREATE INDEX idx_transactions_project_status ON transactions(project_id, status);
CREATE INDEX idx_transactions_customer_created ON transactions(customer_id, created_at);
CREATE INDEX idx_transactions_type_status ON transactions(transaction_type, status);
```

## Testing

### API Testing

```bash
# List all transactions
curl -X GET "http://localhost:8000/api/transactions/transactions" \
  -H "Authorization: Bearer {admin_token}"

# Create manual transaction
curl -X POST "http://localhost:8000/api/transactions/transactions/manual" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "uuid",
    "transaction_type": "deposit",
    "amount": 10000000,
    "payment_method": "bank_transfer",
    "transaction_reference": "TXN123"
  }'

# Get project financial summary
curl -X GET "http://localhost:8000/api/transactions/projects/{project_id}/financial-summary" \
  -H "Authorization: Bearer {admin_token}"
```

### E2E Testing

Create test file: `backend/apps/projects/tests/test_e2e_transactions.py`

```python
from django.test import TestCase
from apps.users.models import User
from apps.projects.models import Project, Proposal, Transaction, TransactionType, TransactionStatus

class TransactionE2ETest(TestCase):
    def test_complete_transaction_flow(self):
        # 1. Create users
        admin = User.objects.create_user(email='admin@test.com', role='admin')
        customer = User.objects.create_user(email='customer@test.com', role='customer')

        # 2. Create project and proposal
        project = Project.objects.create(...)
        proposal = Proposal.objects.create(...)

        # 3. Record deposit payment
        deposit_transaction = Transaction.objects.create(
            project=project,
            customer=customer,
            transaction_type=TransactionType.DEPOSIT,
            status=TransactionStatus.COMPLETED,
            amount=10000000,
            processed_by=admin
        )

        # 4. Verify deposit recorded
        self.assertEqual(Transaction.objects.filter(project=project).count(), 1)

        # 5. Record phase payments
        # ... test phase payment flow

        # 6. Verify financial summary
        # ... test summary calculations
```

## Troubleshooting

### Common Issues

**Issue 1: Transaction not showing in list**
- Check filter settings (status, project_id)
- Verify user has correct permissions (admin/sales)
- Check browser console for API errors

**Issue 2: Cannot create manual transaction**
- Verify user is admin (only admins can create manual transactions)
- Check project_id is valid UUID
- Verify amount is positive number

**Issue 3: Financial summary shows incorrect amounts**
- Check that all transactions have correct status (completed vs pending)
- Verify phase_index matches proposal phases array
- Check for duplicate transactions

**Issue 4: Frontend not updating after transaction**
- Check that `loadTransactions()` or `loadFinancialData()` is called after operation
- Verify API response is 200 OK
- Check browser network tab for errors

## Future Enhancements

1. **Payment Gateway Integration**
   - Integrate VNPay, ZaloPay, Momo
   - Automatic transaction creation on payment callback
   - Real-time status updates

2. **Transaction Receipts**
   - Generate PDF receipts for transactions
   - Email receipts to customers
   - Download receipt from transaction history

3. **Payment Reminders**
   - Automatic email reminders for pending payments
   - SMS notifications
   - Payment deadline tracking

4. **Advanced Reports**
   - Revenue by period (day, week, month, year)
   - Payment method analytics
   - Customer payment behavior analysis
   - Export to Excel/CSV

5. **Bulk Operations**
   - Bulk approve/reject transactions
   - Bulk transaction import from CSV
   - Batch payment recording

## Summary

The Transaction Management System provides:
- ✅ Complete payment history tracking
- ✅ Manual transaction recording (offline payments)
- ✅ Transaction approval workflow
- ✅ Per-project financial overview
- ✅ Phase-by-phase payment tracking
- ✅ Refund and adjustment support
- ✅ Admin transaction management UI
- ✅ Comprehensive financial reporting

This system enables complete financial transparency and control over project payments while maintaining detailed audit trails for all transactions.
