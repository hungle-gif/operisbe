# Reset All User Passwords to 123456789

## Đã sửa 2 lỗi nghiêm trọng:
1. ✅ **API 404 Error** - Fixed proposal send endpoint
2. ✅ **Security Issue** - Added role-based access control middleware

---

## Cách reset tất cả mật khẩu về `123456789`

### Phương án 1: Sử dụng Django Shell (Khuyên dùng)

```bash
cd backend
python manage.py shell
```

Sau đó paste code này:

```python
from apps.users.models import User

new_password = '123456789'
users = User.objects.all()

print(f"\nResetting passwords for {users.count()} users...")

for user in users:
    user.set_password(new_password)
    user.save()
    print(f"OK - {user.email} ({user.role}) - Password reset")

print(f"\n[SUCCESS] All passwords reset to: {new_password}\n")

# Print all accounts
print("\n=== LOGIN CREDENTIALS ===\n")
for role in ['admin', 'sale', 'dev', 'customer']:
    role_users = User.objects.filter(role=role)
    if role_users.exists():
        print(f"\n[{role.upper()}] Accounts:")
        for user in role_users:
            print(f"   Email: {user.email:<30} Password: {new_password}")
```

---

### Phương án 2: Sử dụng Management Command

```bash
cd backend
python manage.py reset_passwords
```

(File đã tạo: `backend/apps/users/management/commands/reset_passwords.py`)

---

### Phương án 3: Tạo tài khoản mới thủ công

```bash
python manage.py shell
```

```python
from apps.users.models import User

# Tạo/Reset Admin
admin, _ = User.objects.update_or_create(
    email='admin@operis.com',
    defaults={
        'full_name': 'Admin User',
        'role': 'admin',
        'is_active': True,
        'is_superuser': True
    }
)
admin.set_password('123456789')
admin.save()
print(f"Admin: admin@operis.com / 123456789")

# Tạo/Reset Sale
sale, _ = User.objects.update_or_create(
    email='sale@operis.com',
    defaults={
        'full_name': 'Sale User',
        'role': 'sale',
        'is_active': True
    }
)
sale.set_password('123456789')
sale.save()
print(f"Sale: sale@operis.com / 123456789")

# Tạo/Reset Developer
dev, _ = User.objects.update_or_create(
    email='dev@operis.com',
    defaults={
        'full_name': 'Developer User',
        'role': 'dev',
        'is_active': True
    }
)
dev.set_password('123456789')
dev.save()
print(f"Developer: dev@operis.com / 123456789")

# Tạo/Reset Customer
customer, _ = User.objects.update_or_create(
    email='customer@operis.com',
    defaults={
        'full_name': 'Customer User',
        'role': 'customer',
        'is_active': True
    }
)
customer.set_password('123456789')
customer.save()
print(f"Customer: customer@operis.com / 123456789")
```

---

## Default Accounts After Reset

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@operis.com | 123456789 |
| Sale | sale@operis.com | 123456789 |
| Developer | dev@operis.com | 123456789 |
| Customer | customer@operis.com | 123456789 |

---

## Kiểm tra sau khi reset

1. Đăng nhập với mỗi account
2. Verify role-based access control:
   - Customer KHÔNG thể truy cập `/dashboard/admin`, `/dashboard/sales`, `/dashboard/developer`
   - Sale KHÔNG thể truy cập `/dashboard/admin`, `/dashboard/developer`, `/dashboard/customer`
   - Developer KHÔNG thể truy cập `/dashboard/admin`, `/dashboard/sales`, `/dashboard/customer`
   - Admin CÓ THỂ truy cập tất cả

---

## Lỗi đã sửa trong session này:

### 1. API 404 Error - `/api/proposals/{id}/send`
**File sửa**: `backend/api/main.py`
```python
# Trước:
api.add_router("/proposals", proposal_router)

# Sau:
api.add_router("", proposal_router)  # Proposal router đã có full paths
```

### 2. Security - Role-Based Access Control
**File tạo mới**: `frontend/middleware.ts`
- Auto-redirect users to their correct dashboard
- Block cross-role access attempts
- JWT token validation
- Handle role variations (dev/developer, sale/sales)

---

## Test Security

```bash
# Login as customer
# Then try to access:
http://localhost:3000/dashboard/admin  # Should redirect to /dashboard/customer
http://localhost:3000/dashboard/sales  # Should redirect to /dashboard/customer
http://localhost:3000/dashboard/developer  # Should redirect to /dashboard/customer
```

All unauthorized access attempts will be automatically redirected to the user's correct dashboard.
