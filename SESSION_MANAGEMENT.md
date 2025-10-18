# 🔐 Session Management - OPERIS System

## Tổng Quan

Hệ thống OPERIS sử dụng **JWT (JSON Web Token)** để quản lý phiên đăng nhập. Khi token hết hạn, hệ thống tự động logout và redirect user về trang login.

---

## 🔄 Luồng Authentication

### **1. Login**
```
User nhập email/password
  ↓
POST /api/auth/login
  ↓
Backend trả về: { access_token, refresh_token, user }
  ↓
Frontend lưu vào localStorage:
  - access_token
  - refresh_token
  - user (JSON string)
  ↓
Redirect to dashboard
```

### **2. Authenticated Requests**
```
User gửi API request
  ↓
Request Interceptor thêm header:
  Authorization: Bearer {access_token}
  ↓
Backend verify token
  ↓
  ├─ Token valid → Process request → Return data
  │
  └─ Token invalid/expired → Return 401 Unauthorized
```

### **3. Token Expiration Handling** ✅ MỚI

```
API returns 401 Unauthorized
  ↓
Response Interceptor detect 401
  ↓
Check if already redirecting? (prevent multiple redirects)
  ├─ Yes → Do nothing
  │
  └─ No → Continue
      ↓
      Clear all localStorage:
        - access_token
        - refresh_token
        - token
        - user
      ↓
      Show console message:
        "⚠️ Phiên đăng nhập đã hết hạn..."
      ↓
      Redirect to /login?returnUrl={currentPath}
      ↓
      Login page shows yellow banner:
        "⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
      ↓
      User login again
      ↓
      Redirect back to returnUrl (original page)
```

---

## 🛠️ Implementation Details

### **File: `frontend/lib/api.ts`**

#### **Request Interceptor** (Thêm Token)
```typescript
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }
)
```

#### **Response Interceptor** (Handle 401) ✅ IMPROVED
```typescript
let isRedirecting = false  // Prevent multiple redirects

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true

        // Clear all auth data
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        // Show message
        console.log('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')

        // Redirect with return URL
        const currentPath = window.location.pathname
        const returnUrl = currentPath !== '/login'
          ? `?returnUrl=${encodeURIComponent(currentPath)}`
          : ''

        setTimeout(() => {
          window.location.href = `/login${returnUrl}`
        }, 100)
      }
    }
    return Promise.reject(error)
  }
)
```

**Cải Tiến:**
1. ✅ **Prevent Multiple Redirects**: Flag `isRedirecting` chỉ cho phép redirect 1 lần duy nhất
2. ✅ **Clear All Auth Data**: Xóa tất cả tokens và user data
3. ✅ **Return URL Support**: Lưu URL hiện tại để redirect lại sau khi login
4. ✅ **User-Friendly Message**: Console log để debug

---

### **File: `frontend/app/(auth)/login/page.tsx`**

#### **Session Expired Detection** ✅ NEW
```typescript
const searchParams = useSearchParams()
const [sessionExpiredMessage, setSessionExpiredMessage] = useState('')

useEffect(() => {
  const returnUrl = searchParams.get('returnUrl')
  if (returnUrl) {
    setSessionExpiredMessage('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  }
}, [searchParams])
```

#### **Return URL Redirect** ✅ NEW
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ... login logic ...

  // Check if there's a return URL
  const returnUrl = searchParams.get('returnUrl')

  if (returnUrl && returnUrl.startsWith('/dashboard')) {
    // Redirect back to the page they were on
    window.location.href = returnUrl
    return
  }

  // Otherwise redirect based on user role
  // ... role-based redirect logic ...
}
```

#### **UI Display** ✅ NEW
```tsx
{sessionExpiredMessage && (
  <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
    <span>{sessionExpiredMessage}</span>
  </div>
)}
```

---

## 📊 User Experience Flow

### **Scenario: Token Expires While User Is Working**

#### **Before (Old Behavior):**
```
User browsing /dashboard/admin/projects
  ↓
Token expires
  ↓
User clicks button → API call → 401
  ↓
Immediately redirect to /login
  ↓
❌ User sees generic login page
  ↓
After login → redirected to /dashboard/admin (default)
  ↓
❌ User lost their place, has to navigate back
```

#### **After (New Behavior):** ✅
```
User browsing /dashboard/admin/projects
  ↓
Token expires
  ↓
User clicks button → API call → 401
  ↓
Clear localStorage + Redirect to /login?returnUrl=/dashboard/admin/projects
  ↓
✅ User sees yellow banner: "Phiên đăng nhập đã hết hạn"
  ↓
After login → redirected to /dashboard/admin/projects (original page)
  ↓
✅ User continues exactly where they left off
```

---

## 🔒 Security Features

### **1. Token Storage**
- ✅ Stored in `localStorage` (accessible only by same origin)
- ✅ Never stored in cookies (prevents CSRF)
- ✅ Cleared immediately on 401

### **2. Auto-Logout**
- ✅ Automatic logout on token expiration
- ✅ No manual intervention needed
- ✅ Clean localStorage to prevent stale data

### **3. Session Continuity**
- ✅ Return URL preserves user context
- ✅ Seamless re-authentication
- ✅ No data loss

---

## 🧪 Testing

### **Test Case 1: Normal Token Expiration**
1. Login as admin
2. Navigate to `/dashboard/admin/transactions`
3. Wait for token to expire (or manually delete token)
4. Click any button that makes API call
5. **Expected:**
   - Redirected to `/login?returnUrl=/dashboard/admin/transactions`
   - Yellow banner shows "Phiên đăng nhập đã hết hạn"
   - After re-login, redirected back to `/dashboard/admin/transactions`

### **Test Case 2: Multiple Failed API Calls**
1. Login as admin
2. Open Network tab in DevTools
3. Delete `access_token` from localStorage
4. Click multiple buttons rapidly (triggering multiple API calls)
5. **Expected:**
   - Only ONE redirect to `/login` (no multiple redirects)
   - All subsequent 401s are ignored
   - Clean redirect without errors

### **Test Case 3: Manual Logout**
1. Login as any user
2. Click "Logout" button
3. **Expected:**
   - Redirected to `/login` (no returnUrl)
   - No session expired message
   - Clean login page

---

## ⚙️ Configuration

### **Token Expiry (Backend)**
Located in: `backend/config/settings/base.py`
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),  # Default: 1 hour
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # Default: 7 days
}
```

To change token lifetime:
```python
# For development (longer session)
'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),

# For production (shorter session)
'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
```

---

## 🚀 Future Enhancements

### **1. Token Refresh** (TODO)
Automatically refresh token before expiration:
```typescript
// In api.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          // Try to refresh token
          const { data } = await authAPI.refresh(refreshToken)
          localStorage.setItem('access_token', data.access_token)

          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.access_token}`
          return api.request(error.config)
        } catch (refreshError) {
          // Refresh failed → logout
          logout()
        }
      } else {
        logout()
      }
    }
    return Promise.reject(error)
  }
)
```

### **2. Proactive Token Refresh**
Check token expiry and refresh before it expires:
```typescript
// Check every 5 minutes
setInterval(() => {
  const token = localStorage.getItem('access_token')
  if (token) {
    const decoded = jwtDecode(token)
    const expiresIn = decoded.exp * 1000 - Date.now()

    // Refresh if expires in < 5 minutes
    if (expiresIn < 5 * 60 * 1000) {
      refreshToken()
    }
  }
}, 5 * 60 * 1000)
```

### **3. Session Timeout Warning**
Show modal before session expires:
```typescript
// Show warning 2 minutes before expiry
if (expiresIn < 2 * 60 * 1000 && expiresIn > 1 * 60 * 1000) {
  showModal({
    title: 'Phiên đăng nhập sắp hết hạn',
    message: 'Phiên của bạn sẽ hết hạn trong 2 phút. Bạn có muốn tiếp tục?',
    actions: [
      { label: 'Tiếp tục', onClick: refreshToken },
      { label: 'Đăng xuất', onClick: logout }
    ]
  })
}
```

---

## 📝 Summary

✅ **Implemented:**
- Auto-logout on 401 Unauthorized
- Prevent multiple redirects
- Return URL support
- Session expired notification
- Clean localStorage on logout

✅ **Benefits:**
- Better UX: User returns to exact page after re-login
- No multiple redirects
- Clear visual feedback
- Secure token handling

✅ **Ready for production!** 🚀
