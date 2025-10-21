# 🚀 Quick Start - Chức Năng Quên Mật Khẩu

Hướng dẫn nhanh để sử dụng chức năng Quên Mật Khẩu & Đổi Mật Khẩu.

---

## ⚡ TL;DR

```bash
# 1. Cấu hình email trong .env
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000

# 2. Migration
docker-compose exec backend python manage.py migrate

# 3. Test
./backend/test_password_reset.sh

# 4. Xem API docs
open http://localhost:8001/api/docs
```

---

## 📋 Setup Gmail (2 phút)

### Bước 1: Bật 2-Step Verification
1. Vào [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Tìm **"2-Step Verification"** → Bật nó

### Bước 2: Tạo App Password
1. Vào [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Chọn **Mail** và **Other (Custom name)**
3. Đặt tên: **"Operis Backend"**
4. Copy password 16 ký tự

### Bước 3: Cấu hình .env

Tạo/edit file `backend/.env`:

```env
# Email Settings
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop  # App password từ bước 2
DEFAULT_FROM_EMAIL=noreply@operis.vn

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**⚠️ Lưu ý:** Dùng **App Password** (16 ký tự), KHÔNG phải password Gmail thường!

---

## 🧪 Test Nhanh

### Option 1: Test Script Tự Động

```bash
chmod +x backend/test_password_reset.sh
./backend/test_password_reset.sh
```

Sẽ test tất cả 9 test cases tự động.

### Option 2: Test Thủ Công

```bash
# Test 1: Forgot Password
curl -X POST http://localhost:8001/api/password-reset/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@operis.vn"}'

# Response: {"success": true, "message": "..."}

# Check email được gửi trong Docker logs:
docker-compose logs backend | grep -A 50 "Subject:"
```

---

## 🌐 API Endpoints

| Endpoint | Method | Auth | Mô Tả |
|----------|--------|------|-------|
| `/password-reset/forgot-password` | POST | ❌ | Gửi email reset |
| `/password-reset/verify-reset-token` | POST | ❌ | Verify token |
| `/password-reset/reset-password` | POST | ❌ | Đặt lại password |
| `/password-reset/change-password` | POST | ✅ | Đổi password (đã login) |

**Base URL:** `http://localhost:8001/api`

---

## 📖 API Documentation

Xem docs chi tiết tại: [http://localhost:8001/api/docs](http://localhost:8001/api/docs)

Tìm section **"Password Reset"** → Expand → Try it out

---

## 💻 Frontend Integration

### 1. Forgot Password Page

```javascript
// components/ForgotPassword.jsx
const handleForgotPassword = async (email) => {
  const response = await fetch('/api/password-reset/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await response.json();
  // Show success: "Check your email for reset link"
};
```

### 2. Reset Password Page

```javascript
// pages/reset-password.jsx
import { useSearchParams } from 'next/navigation';

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Step 1: Verify token on page load
  useEffect(() => {
    verifyToken(token);
  }, [token]);

  const verifyToken = async (token) => {
    const response = await fetch('/api/password-reset/verify-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const data = await response.json();
    if (!data.valid) {
      // Show error: "Invalid or expired link"
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (newPassword, confirmPassword) => {
    const response = await fetch('/api/password-reset/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });

    const data = await response.json();
    if (data.success) {
      // Redirect to login
      router.push('/login');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="password" name="newPassword" />
      <input type="password" name="confirmPassword" />
      <button type="submit">Reset Password</button>
    </form>
  );
};
```

### 3. Change Password (Authenticated)

```javascript
// components/ChangePasswordForm.jsx
const handleChangePassword = async (oldPassword, newPassword, confirmPassword) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch('/api/password-reset/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    })
  });

  const data = await response.json();
  if (data.success) {
    // Show success message
    alert('Password changed successfully!');
  }
};
```

---

## 🔒 Password Requirements

Khi user nhập password, validate:

- ✅ Tối thiểu 8 ký tự
- ✅ Ít nhất 1 chữ cái (a-z, A-Z)
- ✅ Ít nhất 1 số (0-9)
- ✅ Confirm password phải khớp

```javascript
// utils/passwordValidation.js
const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return errors;
};
```

---

## 📧 Email Preview

User sẽ nhận được email đẹp như này:

### Reset Password Email
- 🎨 Gradient header màu tím
- 🔘 Nút "Đặt lại mật khẩu" lớn
- ⏰ Thông báo hết hạn sau 30 phút
- 🔗 Alternative link (nếu button không work)
- 🛡️ Security notice

### Password Changed Email
- ✅ Confirmation icon
- 🚨 Warning nếu không phải user thực hiện
- 💡 Security tips
- 📧 Contact support button

**Xem preview:** `backend/apps/users/templates/emails/*.html`

---

## 🐛 Troubleshooting

### Email không được gửi?

```bash
# Check Docker logs
docker-compose logs backend | grep -i email

# Test SMTP connection
docker-compose exec backend python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Body', 'from@gmail.com', ['to@email.com'])
```

**Nguyên nhân thường gặp:**
- ❌ Không bật 2-Step Verification
- ❌ Dùng password Gmail thường thay vì App Password
- ❌ App Password sai
- ❌ Email bị vào Spam folder

### Token không hợp lệ?

```bash
# Check trong Django shell
docker-compose exec backend python manage.py shell

>>> from apps.users.models import PasswordResetToken
>>> token = PasswordResetToken.objects.filter(user__email='admin@operis.vn').first()
>>> print(f"Valid: {token.is_valid()}")
>>> print(f"Expired: {token.is_expired}")
>>> print(f"Used: {token.is_used}")
```

### Development Mode (No Email)

Nếu không muốn setup Gmail, dùng console backend:

```env
# .env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Email sẽ hiển thị trong terminal thay vì gửi thật:

```bash
docker-compose logs -f backend
# Email content sẽ xuất hiện ở đây
```

---

## 📚 Tài Liệu Đầy Đủ

- **Comprehensive Guide:** `backend/PASSWORD_RESET_README.md`
- **Summary:** `backend/PASSWORD_RESET_SUMMARY.md`
- **This Guide:** `QUICK_START_PASSWORD_RESET.md`

---

## ✅ Checklist Hoàn Thành

### Backend
- [x] Gmail App Password configured
- [x] .env file updated
- [x] Migration applied
- [x] Test script runs successfully
- [x] API docs accessible

### Frontend (TODO)
- [ ] Forgot password page
- [ ] Reset password page
- [ ] Change password form
- [ ] Error handling
- [ ] Success messages

---

## 🎯 Next Steps

1. **Implement Frontend Pages:**
   - `/forgot-password`
   - `/reset-password?token=xxx`
   - `/settings/change-password`

2. **Add Rate Limiting** (Production):
   ```python
   # Install django-ratelimit
   pip install django-ratelimit

   # Add to forgot_password endpoint
   @ratelimit(key='ip', rate='5/h', method='POST')
   ```

3. **Setup Celery** (Optional):
   ```python
   # Periodic task to cleanup expired tokens
   @periodic_task(run_every=timedelta(days=1))
   def cleanup_tokens():
       service = PasswordResetService()
       deleted = service.cleanup_expired_tokens()
   ```

4. **Monitor Email Sending:**
   - Setup email sending logs
   - Monitor bounce rates
   - Track delivery rates

---

## 💡 Tips & Best Practices

✅ **DO:**
- Sử dụng HTTPS trong production
- Set up rate limiting
- Monitor email logs
- Use strong password requirements
- Test forgot password flow end-to-end

❌ **DON'T:**
- Tiết lộ email có tồn tại hay không
- Cho phép unlimited reset requests
- Gửi password qua email
- Skip password validation
- Use short token expiration (< 15 minutes)

---

## 🆘 Support

Nếu gặp vấn đề:

1. Check `backend/PASSWORD_RESET_README.md` - Troubleshooting section
2. Run test script: `./backend/test_password_reset.sh`
3. Check Docker logs: `docker-compose logs backend`
4. Verify .env configuration
5. Test SMTP connection

---

**Happy Coding! 🚀**

© 2025 Operis
