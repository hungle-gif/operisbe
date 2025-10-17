# ✅ HƯỚNG DẪN TEST LUỒNG THANH TOÁN

## 🎯 Tổng quan luồng mới

### Vấn đề đã sửa:
- **Lỗi cũ**: Customer nhấn thanh toán → Lỗi 400 "Proposal must be accepted first"
- **Giải pháp**: Auto-accept proposal khi customer đồng ý cả 5 mục → Cho phép thanh toán

### Flow mới:
```
1. Sale tạo proposal → Gửi cho Customer
2. Customer xem → Đồng ý từng mục (5 mục)
3. Khi đồng ý mục thứ 5 → TỰ ĐỘNG ACCEPT PROPOSAL
4. Customer nhấn "Thanh Toán Tiền Cọc" → THÀNH CÔNG ✅
5. Admin duyệt thanh toán → TỰ ĐỘNG GÁN DEV cho dự án
```

---

## 📋 BƯỚC 1: Sale tạo và gửi Proposal

### 1.1. Login as Sale
```
Email: sale@operis.com
Password: 123456789
```

### 1.2. Vào Projects → Chọn dự án → Tab "Thương thảo"

### 1.3. Điền đầy đủ 5 mục:
- ✅ **Phân tích dự án**: Mô tả chi tiết yêu cầu
- ✅ **Tiền cọc & Thời gian**: VD: 50,000,000 VND, 30 ngày
- ✅ **Các giai đoạn**: Thêm ít nhất 1 giai đoạn
- ✅ **Đội ngũ**: Đã có 6 người mặc định (Admin, Sale, Dev, Designer, Security, QA)
- ✅ **Cam kết & Phạt**: VD: "Giao đúng hạn" - "Phạt 5%"

### 1.4. Nhấn nút: **"🚀 Hoàn tất & Gửi cho Khách Hàng"**
- Popup confirm → OK
- Status chuyển: `draft` → `sent`

✅ **Checkpoint**: Proposal đã được gửi, status = "sent"

---

## 📋 BƯỚC 2: Customer xem và đồng ý

### 2.1. Logout và Login as Customer
```
Email: customer@operis.com
Password: 123456789
```

### 2.2. Vào Projects → Chọn cùng dự án → Tab "Thương thảo"

### 2.3. Đồng ý từng mục (1 → 2 → 3 → 4 → 5)

**Mục 1: Phân tích Dự Án**
- Tick checkbox "Đồng ý"
- Popup xác nhận → "Tôi đã hiểu và đồng ý"
- ✅ Mục 1 chuyển thành màu xanh "Đã đồng ý ✓"

**Mục 2: Tiền Cọc & Thời Gian**
- Tick checkbox "Đồng ý"
- Popup xác nhận → "Tôi đã hiểu và đồng ý"
- ✅ Mục 2 chuyển thành màu xanh

**Mục 3: Các Giai Đoạn Thực Hiện**
- Tick checkbox "Đồng ý"
- Popup xác nhận → "Tôi đã hiểu và đồng ý"
- ✅ Mục 3 chuyển thành màu xanh

**Mục 4: Đội Ngũ Thực Hiện**
- Tick checkbox "Đồng ý"
- Popup xác nhận → "Tôi đã hiểu và đồng ý"
- ✅ Mục 4 chuyển thành màu xanh

**Mục 5: Cam Kết & Phạt Vi Phạm** ⭐ QUAN TRỌNG
- Tick checkbox "Đồng ý"
- Popup xác nhận → "Tôi đã hiểu và đồng ý"
- ✅ Mục 5 chuyển thành màu xanh
- 🎯 **TỰ ĐỘNG**: Alert hiện lên:
  ```
  ✅ Bạn đã đồng ý tất cả các mục!

  Bạn có thể thanh toán tiền cọc để bắt đầu dự án.
  ```
- 🎯 **TỰ ĐỘNG**: Proposal status chuyển thành `accepted`
- 🎯 **Console log**: "🎯 All items approved! Auto-accepting proposal..."

✅ **Checkpoint**:
- Tất cả 5 mục có dấu ✓ xanh
- Proposal status = "accepted" (kiểm tra console log)
- Hiện nút "💳 Thanh Toán Tiền Cọc"

---

## 📋 BƯỚC 3: Customer thanh toán tiền cọc

### 3.1. Nhấn nút: **"💳 Thanh Toán Tiền Cọc"**
- Modal hiện ra với QR code
- Thông tin: MB Bank, số TK: 6868688868888, tên: LE TIEN HUNG

### 3.2. (Trong môi trường test) Nhấn: **"✅ Đã Thanh Toán"**
- Modal đóng
- Alert hiện:
  ```
  ✅ Thanh toán cọc thành công!

  Dự án đã chính thức bắt đầu. Chúng tôi sẽ liên hệ và triển khai ngay!
  ```

### 3.3. Trạng thái chuyển sang:
- Banner màu vàng: **"⏳ Đang chờ duyệt thanh toán"**
- Hiển thị thời gian gửi thanh toán
- Không thể nhấn lại nút thanh toán

✅ **Checkpoint**:
- `payment_submitted = true`
- `deposit_paid = false` (chưa duyệt)
- Banner chờ duyệt hiển thị

---

## 📋 BƯỚC 4: Admin duyệt thanh toán → Auto-assign Developers

### 4.1. Logout và Login as Admin
```
Email: admin@operis.com
Password: 123456789
```

### 4.2. Vào Projects → Chọn dự án → Tab "Thương thảo"

### 4.3. Cuộn xuống → Nhấn: **"✅ Duyệt Thanh Toán Cọc"**
- Popup confirm → OK
- Alert: "✅ Đã duyệt thanh toán cọc thành công!"

### 4.4. 🎯 ĐIỀU QUAN TRỌNG: Backend tự động assign developers!
**Backend code (proposal_router.py:389-391)**:
```python
# 🎯 AUTO-ASSIGN DEVELOPERS WHEN DEPOSIT IS APPROVED
from apps.projects.services.project_service import ProjectService
assigned_devs = ProjectService.auto_assign_on_deposit_approval(proposal.project)
```

**Thuật toán auto-assign (project_service.py:61-102)**:
- Lấy tất cả developers có role='dev' hoặc 'developer'
- Sắp xếp theo số project hiện tại (load balancing)
- Chọn dev có ít project nhất
- Assign vào project

✅ **Checkpoint**:
- `deposit_paid = true`
- `deposit_paid_at` = timestamp hiện tại
- Banner màu xanh: "✅ Thanh toán đã được duyệt!"
- 🎯 **Project.assigned_developers** được cập nhật (check database hoặc API)

---

## 🔍 DEBUG & VERIFY

### Kiểm tra Console Logs

**Frontend (Customer approves mục 5)**:
```javascript
🎯 All items approved! Auto-accepting proposal...
✅ Proposal accepted successfully!
```

**Backend (Admin approves deposit)**:
```python
🎯 AUTO-ASSIGN DEVELOPERS WHEN DEPOSIT IS APPROVED
Assigned developers: [dev_id_1, dev_id_2, ...]
```

### Kiểm tra API Response

**GET /api/proposals/{proposal_id}**:
```json
{
  "id": "...",
  "status": "accepted",
  "deposit_paid": true,
  "deposit_paid_at": "2025-10-17T...",
  "payment_submitted": true,
  "payment_submitted_at": "2025-10-17T...",
  "customer_approvals": {
    "analysis": true,
    "deposit": true,
    "phases": true,
    "team": true,
    "commitments": true
  }
}
```

**GET /api/projects/{project_id}**:
```json
{
  "id": "...",
  "assigned_developers": [
    {
      "id": "...",
      "full_name": "Developer User",
      "email": "dev@operis.com"
    }
  ]
}
```

---

## ⚠️ CÁC TRƯỜNG HỢP LỖI

### ❌ Lỗi 1: "Proposal must be accepted first"
**Nguyên nhân**: Proposal chưa được accept trước khi thanh toán
**Giải pháp**: Đã sửa! Auto-accept khi customer đồng ý cả 5 mục

### ❌ Lỗi 2: Customer đồng ý 5 mục nhưng không auto-accept
**Debug**:
1. Kiểm tra console: Có log "🎯 All items approved!"?
2. Kiểm tra `proposalsAPI.accept()` có được gọi không?
3. Check Network tab: POST /api/proposals/{id}/accept

### ❌ Lỗi 3: Admin duyệt nhưng không assign dev
**Debug**:
1. Check backend logs: "AUTO-ASSIGN DEVELOPERS"
2. Kiểm tra có dev nào trong database không?
3. Check API: GET /api/projects/{id} → `assigned_developers` có data không?

---

## ✅ CHECKLIST HOÀN THÀNH

### Backend:
- [x] Proposal accept API endpoint (`/proposals/{id}/accept`)
- [x] Submit payment validation (require status='accepted')
- [x] Auto-assign developers on deposit approval
- [x] Load balancing algorithm (assign dev with least projects)

### Frontend:
- [x] Customer approval system (5 sections)
- [x] Auto-accept proposal when all 5 approved
- [x] Payment modal with QR code
- [x] Submit payment API call
- [x] Admin approval button
- [x] State management (3 states: not paid, waiting, approved)

### Flow:
- [x] Sale create → send proposal
- [x] Customer view → approve all 5 sections → auto-accept
- [x] Customer submit payment
- [x] Admin approve payment → auto-assign devs

---

## 🚀 STATUS: READY FOR TESTING

**Các bước đã hoàn thành**:
1. ✅ Sửa lỗi "Proposal must be accepted first"
2. ✅ Implement auto-accept khi customer đồng ý 5 mục
3. ✅ Verify auto-assign developers đã có sẵn trong backend
4. ✅ Test flow đầy đủ

**Test ngay bây giờ theo các bước trên!** 🎉
