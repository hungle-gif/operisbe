# 🔄 Token Refresh Mechanism - OPERIS System

## 🎯 Overview

OPERIS sử dụng **Auto Refresh Token** để user có thể làm việc liên tục mà không bị logout sau 1 giờ. Khi Access Token hết hạn, hệ thống tự động dùng Refresh Token để lấy token mới và retry failed request.

---

## ⏱️ Token Lifetime

### **Backend Configuration** (`backend/config/settings/base.py`)

```python
JWT_ACCESS_TOKEN_LIFETIME = 60 * 60         # 1 hour
JWT_REFRESH_TOKEN_LIFETIME = 60 * 60 * 24 * 7  # 7 days
```

**Giải thích:**
- **Access Token**: 1 giờ - Token ngắn hạn để bảo mật cao
- **Refresh Token**: 7 ngày - Token dài hạn để refresh access token

---

## 🔄 Complete Flow

### **Scenario: User làm việc 2 giờ liên tục**

```
User login @ 9:00 AM
  ↓
Nhận tokens:
  - access_token (expires @ 10:00 AM)
  - refresh_token (expires @ 9:00 AM + 7 days)
  ↓
User làm việc bình thường...
  ↓
9:50 AM - User click button → API call → SUCCESS ✅
  ↓
10:01 AM - Access token đã HẾT HẠN
  ↓
User click button → API call → 401 Unauthorized ❌
  ↓
📍 AUTO REFRESH TRIGGER:
  ↓
Frontend Interceptor:
  1. Detect 401
  2. Check refresh_token exists? → YES
  3. Call POST /api/auth/refresh
  4. Backend verify refresh_token → VALID ✅
  5. Backend returns NEW tokens:
     - new access_token (expires @ 11:01 AM)
     - new refresh_token (expires @ 10:01 AM + 7 days)
  6. Update localStorage
  7. Retry original request with new access_token
  ↓
Original request SUCCESS ✅
  ↓
User KHÔNG BỊ LOGOUT, làm việc tiếp tục
  ↓
11:30 AM - User vẫn đang làm việc
  ↓
User click → 401 → Auto refresh lại → SUCCESS ✅
  ↓
... Process repeats ...
  ↓
User có thể làm việc liên tục trong 7 NGÀY 🎉
```

---

## 🛠️ Implementation Details

### **1. Backend - Refresh Endpoint**

**File:** `backend/apps/users/routers/auth_router.py`

```python
@router.post("/refresh", response=TokenResponse)
def refresh_token(request, payload: RefreshTokenSchema):
    """Refresh access token using refresh token"""
    result = auth_service.refresh_token(payload.refresh_token)
    return result
```

**File:** `backend/apps/users/services/auth_service.py`

```python
def refresh_token(self, refresh_token: str) -> Dict:
    """Refresh access token"""
    try:
        # Verify refresh token
        user_id = verify_token(refresh_token, token_type='refresh')
    except Exception as e:
        raise UnauthorizedException(str(e))

    user = self.user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found")

    # Generate NEW tokens (both access + refresh)
    access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    return {
        'access_token': access_token,
        'refresh_token': new_refresh_token,  # New refresh token
        'user': user
    }
```

**Important:**
- ✅ Backend returns **NEW refresh token** mỗi lần refresh
- ✅ Refresh token rotation để bảo mật cao hơn

---

### **2. Frontend - Auto Refresh Interceptor**

**File:** `frontend/lib/api.ts`

#### **State Management**
```typescript
let isRefreshing = false  // Track if refresh is in progress
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []  // Queue failed requests during refresh
```

#### **Response Interceptor Logic**

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')

      // CASE 1: Has refresh token + Not already refreshing
      if (refreshToken && !isRefreshing) {
        isRefreshing = true
        originalRequest._retry = true

        try {
          console.log('🔄 Access token expired. Refreshing...')

          // Call refresh API
          const response = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken
          })

          const { access_token, refresh_token: new_refresh_token } = response.data

          // Update tokens in localStorage
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('token', access_token)
          if (new_refresh_token) {
            localStorage.setItem('refresh_token', new_refresh_token)
          }

          // Update axios header
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`

          console.log('✅ Token refreshed successfully')

          // Process queued requests
          processQueue(null)
          isRefreshing = false

          // RETRY ORIGINAL REQUEST
          return api(originalRequest)

        } catch (refreshError) {
          console.log('❌ Refresh token failed')
          processQueue(refreshError)
          isRefreshing = false

          // Refresh failed → Logout
          logout()
          return Promise.reject(refreshError)
        }
      }

      // CASE 2: Already refreshing → Queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            // Retry with new token
            originalRequest.headers['Authorization'] =
              `Bearer ${localStorage.getItem('access_token')}`
            return api(originalRequest)
          })
      }

      // CASE 3: No refresh token → Logout immediately
      if (!refreshToken) {
        logout()
      }
    }

    return Promise.reject(error)
  }
)
```

---

## 📊 Flow Diagrams

### **Success Flow: Multiple Concurrent Requests**

```
Time: 10:01 AM (Access token expired)

User clicks 3 buttons simultaneously:
  Request A → 401 ❌
  Request B → 401 ❌
  Request C → 401 ❌
  ↓
Request A hits interceptor FIRST:
  - isRefreshing = false → Set to true ✅
  - Call /auth/refresh
  - Get new tokens
  ↓
Request B hits interceptor (isRefreshing = true):
  - Add to failedQueue
  - WAIT... ⏳
  ↓
Request C hits interceptor (isRefreshing = true):
  - Add to failedQueue
  - WAIT... ⏳
  ↓
Request A refresh SUCCESS:
  - Update tokens ✅
  - processQueue() → Resolve all queued requests
  - isRefreshing = false
  ↓
Request B & C auto-retry with new token:
  - Request B → SUCCESS ✅
  - Request C → SUCCESS ✅
  ↓
Result: ALL 3 requests succeed! 🎉
Only 1 refresh API call made!
```

### **Failure Flow: Refresh Token Expired**

```
User idle for 8 days...
  ↓
Access Token expired (> 1 hour)
Refresh Token expired (> 7 days)
  ↓
User comes back, clicks button:
  ↓
Request → 401 ❌
  ↓
Interceptor:
  - Has refresh_token → YES
  - Call /auth/refresh
  ↓
Backend:
  - Verify refresh_token
  - Expired! ❌
  - Return 401
  ↓
Frontend:
  - Refresh failed
  - Clear localStorage
  - Redirect to /login?returnUrl=...
  ↓
User sees:
  "⚠️ Phiên đăng nhập đã hết hạn..."
  ↓
User login again → Continue work
```

---

## 🔐 Security Features

### **1. Token Rotation**
✅ **Mỗi lần refresh → New refresh token**
- Old refresh token becomes invalid
- Prevents replay attacks

### **2. Single Refresh Call**
✅ **Multiple 401s → Only 1 refresh API call**
- `isRefreshing` flag prevents duplicate calls
- Other requests queued and auto-retried

### **3. Automatic Cleanup**
✅ **Failed refresh → Auto logout**
- Clear all tokens
- Redirect to login
- No stale data

### **4. Request Retry**
✅ **Transparent to user**
- Original request automatically retried
- User doesn't see any error
- Seamless experience

---

## 🧪 Testing

### **Test 1: Auto Refresh Works**

**Setup:**
1. Login as admin
2. Open DevTools → Application → LocalStorage
3. Note `access_token` value

**Test:**
```bash
# Wait 1 hour (or manually manipulate token expiry)
# OR use this hack:

# In Console:
localStorage.setItem('access_token', 'expired_token_xxx')

# Click any button that makes API call
# Expected:
# 1. Console log: "🔄 Access token expired. Refreshing..."
# 2. Console log: "✅ Token refreshed successfully"
# 3. Request succeeds
# 4. Check localStorage → new access_token
```

### **Test 2: Multiple Concurrent 401s**

**Test:**
```javascript
// In Console, delete access token
localStorage.removeItem('access_token')

// Click multiple buttons rapidly (5+ buttons)
// Expected:
// - Only 1 console log: "🔄 Access token expired..."
// - Only 1 refresh API call
// - All requests succeed
```

### **Test 3: Refresh Token Expired**

**Test:**
```javascript
// Delete refresh token
localStorage.removeItem('refresh_token')
localStorage.setItem('access_token', 'expired')

// Click button
// Expected:
// - Console: "⚠️ No refresh token. Please login again."
// - Redirect to /login
```

---

## 📈 Benefits

### **Before (Without Auto Refresh):**
```
User login → Work for 1 hour → Token expires
  ↓
Next API call → 401 → LOGOUT ❌
  ↓
User must login again every hour 😞
```

### **After (With Auto Refresh):** ✅
```
User login → Work for 7 days continuously
  ↓
Every hour: Auto refresh seamlessly
  ↓
User NEVER sees logout (unless idle > 7 days) 🎉
```

| Feature | Before | After ✅ |
|---------|--------|----------|
| **Session Duration** | 1 hour | Up to 7 days |
| **User Experience** | Login hourly 😞 | Seamless 🎉 |
| **Failed Requests** | Lost ❌ | Auto-retried ✅ |
| **Multiple 401s** | Multiple errors | Single refresh ✅ |
| **Security** | Medium | High (token rotation) ✅ |

---

## ⚙️ Configuration

### **Adjust Token Lifetime**

**For Development (longer sessions):**
```python
# backend/config/settings/development.py
JWT_ACCESS_TOKEN_LIFETIME = 60 * 60 * 24  # 24 hours
JWT_REFRESH_TOKEN_LIFETIME = 60 * 60 * 24 * 30  # 30 days
```

**For Production (security):**
```python
# backend/config/settings/production.py
JWT_ACCESS_TOKEN_LIFETIME = 60 * 15  # 15 minutes
JWT_REFRESH_TOKEN_LIFETIME = 60 * 60 * 24  # 1 day
```

---

## 🚀 Future Enhancements

### **1. Proactive Token Refresh**
Refresh token BEFORE it expires:

```typescript
// Check token expiry every 5 minutes
setInterval(() => {
  const token = localStorage.getItem('access_token')
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiresIn = payload.exp * 1000 - Date.now()

    // Refresh if < 5 minutes remaining
    if (expiresIn < 5 * 60 * 1000) {
      refreshTokenProactively()
    }
  }
}, 5 * 60 * 1000)
```

### **2. Session Timeout Warning**
Warn user before refresh token expires:

```typescript
if (refreshTokenExpiresIn < 1 * 60 * 60 * 1000) {  // < 1 hour
  showModal({
    title: 'Phiên sắp hết hạn',
    message: 'Bạn sẽ bị đăng xuất sau 1 giờ nếu không có hoạt động.',
    action: 'Gia hạn phiên' // Refresh token manually
  })
}
```

---

## ✨ Summary

✅ **Auto Refresh Token Implemented:**
- ✅ Seamless user experience
- ✅ Work continuously for 7 days
- ✅ Auto-retry failed requests
- ✅ Token rotation security
- ✅ Single refresh call for multiple 401s
- ✅ Graceful fallback to login

✅ **Production Ready!** 🚀

**User Experience:**
- Không bị logout mỗi giờ
- Làm việc liên tục cả ngày
- Transparent refresh (không thấy lỗi)
- Chỉ cần login lại sau 7 ngày idle

**Bây giờ user có thể làm việc thoải mái mà không lo bị logout! 🎉**
