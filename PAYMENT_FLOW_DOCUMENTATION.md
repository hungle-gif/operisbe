# 📋 Luồng Thanh Toán - OPERIS System

## 🎯 Tổng Quan

Hệ thống OPERIS có luồng thanh toán hoàn chỉnh với **Transaction Management** tự động. Mọi giao dịch thanh toán (deposit, phase payments) đều được tự động ghi nhận vào bảng `transactions`.

---

## 🔄 Luồng Thanh Toán Hoàn Chỉnh

### 1️⃣ **Đặt Cọc (Deposit Payment)**

#### **Flow:**
```
Customer nhận Proposal
  ↓
Customer Accept Proposal
  ↓
Customer Click "Đã Thanh Toán" (submit-payment)
  ↓
✅ AUTO APPROVED
  ↓
🎯 Transaction Record Created (deposit)
  ↓
Project Status → IN_PROGRESS
  ↓
Auto-assign Developers
```

#### **API Endpoint:**
```http
POST /api/proposals/{proposal_id}/submit-payment
Role: Customer Only
```

#### **What Happens:**
1. ✅ `proposal.deposit_paid = True`
2. ✅ `proposal.deposit_paid_at = now()`
3. ✅ **Transaction được tạo tự động** qua `record_payment_transaction()`
   - `transaction_type = 'deposit'`
   - `status = 'completed'`
   - `amount = deposit_amount`
   - `completed_at = now()`
4. ✅ `project.status = 'in_progress'`
5. ✅ Auto-assign developers

#### **Transaction Record:**
```json
{
  "id": "uuid",
  "project_id": "project_uuid",
  "proposal_id": "proposal_uuid",
  "customer_id": "customer_user_id",
  "transaction_type": "deposit",
  "status": "completed",
  "amount": 1000000,
  "payment_method": "bank_transfer",
  "description": "Deposit payment auto-approved by customer",
  "created_at": "2025-10-17T10:00:00Z",
  "completed_at": "2025-10-17T10:00:00Z",
  "metadata": {
    "source": "auto_deposit_submit",
    "auto_approved": true
  }
}
```

---

### 2️⃣ **Thanh Toán Giai Đoạn (Phase Payment)**

#### **Flow:**
```
Developer hoàn thành Phase
  ↓
Sales/Admin Mark Phase Complete
  ↓
Customer xem kết quả → Click "Đã Thanh Toán"
  ↓
✅ AUTO APPROVED
  ↓
🎯 Transaction Record Created (phase)
  ↓
Phase marked as paid
  ↓
[Nếu là phase cuối] → Project COMPLETED
```

#### **Step 1: Mark Phase Complete (Sales/Admin)**
```http
POST /api/proposals/{proposal_id}/phases/{phase_index}/complete
Role: Admin/Sales
```

**What Happens:**
- ✅ `phase.completed = True`
- ✅ `phase.completed_at = now()`
- ✅ `phase.completed_by = admin_user_id`

#### **Step 2: Submit Phase Payment (Customer)**
```http
POST /api/proposals/{proposal_id}/phases/{phase_index}/submit-payment
Role: Customer Only
```

**What Happens:**
1. ✅ `phase.payment_submitted = True`
2. ✅ `phase.payment_approved = True` (AUTO APPROVED)
3. ✅ `phase.payment_approved_at = now()`
4. ✅ **Transaction được tạo tự động** qua `record_payment_transaction()`
   - `transaction_type = 'phase'`
   - `status = 'completed'`
   - `amount = phase.amount`
   - `phase_index = phase_index`
   - `phase_name = phase.name`
   - `completed_at = now()`
5. ✅ Nếu tất cả phases đã paid → `project.status = 'completed'`

#### **Transaction Record:**
```json
{
  "id": "uuid",
  "project_id": "project_uuid",
  "proposal_id": "proposal_uuid",
  "customer_id": "customer_user_id",
  "transaction_type": "phase",
  "status": "completed",
  "amount": 5000000,
  "phase_index": 0,
  "phase_name": "Phase 1: Design",
  "payment_method": "bank_transfer",
  "description": "Phase 1 payment auto-approved by customer",
  "created_at": "2025-10-17T12:00:00Z",
  "completed_at": "2025-10-17T12:00:00Z",
  "metadata": {
    "source": "auto_phase_submit",
    "auto_approved": true,
    "phase_data": {...}
  }
}
```

---

## 🗂️ Database Schema

### **Transaction Model**
```python
class Transaction(models.Model):
    id = UUIDField(primary_key=True)

    # Relationships
    project = ForeignKey('Project')
    proposal = ForeignKey('Proposal')
    customer = ForeignKey('User')

    # Transaction Details
    transaction_type = CharField(choices=['deposit', 'phase', 'refund', 'adjustment'])
    status = CharField(choices=['pending', 'completed', 'failed', 'cancelled'])
    amount = DecimalField(max_digits=12, decimal_places=0)

    # Phase Info (if applicable)
    phase_index = IntegerField(null=True)
    phase_name = CharField(null=True)

    # Payment Info
    payment_method = CharField(default='bank_transfer')
    transaction_reference = CharField(null=True)
    description = TextField(null=True)
    metadata = JSONField(default=dict)

    # Timestamps
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    completed_at = DateTimeField(null=True)

    # Admin Tracking
    processed_by = ForeignKey('User', null=True)
```

---

## 🔧 Function: `record_payment_transaction()`

**Location:** `backend/apps/projects/routers/proposal_router.py` (lines 91-174)

**Purpose:** Đảm bảo mọi giao dịch thanh toán đều được ghi nhận vào bảng `transactions`

**Features:**
- ✅ Tạo Transaction mới hoặc update existing
- ✅ Tự động set `status = COMPLETED`
- ✅ Lưu đầy đủ metadata
- ✅ Prevent duplicates (check existing by project + proposal + type + phase_index)

**Usage:**
```python
record_payment_transaction(
    project=proposal.project,
    proposal=proposal,
    transaction_type=TransactionType.DEPOSIT,  # or PHASE
    amount=Decimal(str(amount)),
    phase_index=None,  # or phase number
    phase_name=None,   # or phase name
    description="Payment description",
    payment_method='bank_transfer',
    transaction_reference='REF123',
    metadata={'key': 'value'}
)
```

**Called In:**
1. ✅ `submit-payment` (deposit) - Line 519
2. ✅ `confirm-payment` (admin deposit) - Line 578
3. ✅ `submit-phase-payment` - Line 719

---

## 📊 Admin Transaction Management

### **View All Transactions**
```http
GET /api/transactions/transactions
Role: Admin/Sales

Query Params:
  - status: pending/completed/failed/cancelled
  - project_id: filter by project
```

### **View Project Financial Summary**
```http
GET /api/transactions/projects/{project_id}/financial-summary
Role: Admin/Sales/Customer (own projects)

Response:
{
  "financial_summary": {
    "contract_value": 15000000,      // Tổng ngân sách dự án
    "total_received": 11500000,       // Tổng tiền đã thu
    "total_refunded": 0,
    "net_received": 11500000,
    "pending_amount": 3500000         // Còn lại chưa thu
  },
  "deposit": {...},
  "phases": [...],
  "transaction_summary": {
    "total_transactions": 7,
    "completed": 7,
    "pending": 0,
    "failed": 0
  }
}
```

### **Create Manual Transaction (Admin Only)**
```http
POST /api/transactions/transactions/manual
Role: Admin Only

Body:
{
  "project_id": "uuid",
  "transaction_type": "deposit|phase|refund|adjustment",
  "amount": 1000000,
  "phase_index": 0,  // optional
  "payment_method": "bank_transfer",
  "transaction_reference": "BANK_REF_123",
  "description": "Manual payment record"
}
```

---

## 📈 UI Pages

### 1. **Transaction Management Page**
**URL:** `/dashboard/admin/transactions`

**Features:**
- ✅ View all transactions across all projects
- ✅ Filter by status, project
- ✅ Summary cards: Total transactions, Total received, Pending, Completed
- ✅ Approve/Reject pending transactions
- ✅ Create manual transaction
- ✅ View detailed history with time stamps

### 2. **Project Finance Page**
**URL:** `/dashboard/admin/projects/{project_id}/finance`

**Features:**
- ✅ Financial summary cards:
  - **Tổng Ngân Sách Dự Án** (contract value)
  - **Tổng Tiền Đã Thu** (total received)
  - **Tiền Đã Hoàn Trả** (refunds)
  - **Số Tiền Còn Lại** (pending)
- ✅ Deposit status
- ✅ Phase breakdown with payment status
- ✅ Complete transaction history with:
  - Thời gian nạp (created_at)
  - Thời gian hoàn thành (completed_at)
  - Số tiền nạp
  - Phương thức thanh toán
  - Người xử lý

---

## 🔄 Migration: Existing Payments

**Script:** `migrate_existing_payments_to_transactions.py`

**Purpose:** Tạo Transaction records cho các payments đã có trước khi implement Transaction system

**Run:**
```bash
docker-compose exec backend python migrate_existing_payments_to_transactions.py
```

**Results:**
```
✅ Deposits migrated:    3
✅ Phases migrated:      4
📊 Total transactions created: 7

Database:
   - Deposits: 3 transactions
   - Phases:   4 transactions
   - Total:    7 transactions
   - All COMPLETED
```

---

## ✅ Testing Checklist

### **Deposit Payment Flow:**
- [ ] Customer accepts proposal
- [ ] Customer clicks "Đã Thanh Toán"
- [ ] Transaction record created in database
- [ ] Project status changes to IN_PROGRESS
- [ ] Developers auto-assigned
- [ ] Transaction visible in admin dashboard

### **Phase Payment Flow:**
- [ ] Admin marks phase complete
- [ ] Customer submits phase payment
- [ ] Transaction record created with correct phase_index
- [ ] Phase marked as paid in proposal
- [ ] If last phase → Project status = COMPLETED
- [ ] Transaction visible in admin dashboard

### **Transaction Management:**
- [ ] View all transactions in admin page
- [ ] Filter by status, project works
- [ ] Summary statistics accurate
- [ ] Can create manual transaction (admin)
- [ ] Project finance page shows correct totals
- [ ] History shows complete timeline with timestamps

---

## 🚀 Future Enhancements

1. **Payment Gateway Integration (SePay)**
   - Webhook to verify actual bank transfer
   - Auto-create transaction on webhook success
   - Store bank transaction reference

2. **Refund System**
   - Create refund transactions
   - Link to original payment
   - Update financial summary

3. **Payment Reminders**
   - Email notifications for pending payments
   - Overdue payment alerts

4. **Financial Reports**
   - Monthly revenue reports
   - Customer payment history
   - Export to Excel/PDF

---

## 📞 Support

- **Backend API:** `backend/apps/projects/routers/transaction_router.py`
- **Frontend Pages:**
  - Transactions: `frontend/app/(dashboard)/dashboard/admin/transactions/page.tsx`
  - Finance: `frontend/app/(dashboard)/dashboard/admin/projects/[id]/finance/page.tsx`
- **Database Models:** `backend/apps/projects/models/transaction.py`
- **Migration Script:** `backend/migrate_existing_payments_to_transactions.py`

---

## ✨ Summary

✅ **Luồng thanh toán hoàn chỉnh và tự động**
✅ **Mọi payment tự động tạo Transaction record**
✅ **Admin có đầy đủ visibility về financial transactions**
✅ **UI hiển thị chi tiết: thời gian nạp, tổng tiền, lịch sử đầy đủ**
✅ **Migration script cho dữ liệu cũ**
✅ **Ready for production** 🚀
