# Frontend-Backend Integration Guide

## 🎯 Problem: Logout on Refresh

**Root Cause**: Access token stored in React state/memory → Page refresh → State reset → Token lost → Logout

**Solution**: Proper token management with auto-refresh

---

## ✅ Files Created for Integration

### 1. `src/config/api.ts`
- API base URLs
- Endpoint definitions
- Environment variable support

### 2. `src/services/axiosInstance.ts`
- Axios instance with interceptors
- **Auto token refresh on 401**
- Request queuing during refresh
- Credentials: true (sends cookies)

### 3. `src/services/authService.ts`
- Login, Register, Logout functions
- Token management
- User state management

### 4. `src/contexts/AuthContext.tsx`
- Global auth state
- Auto-restore user on page load
- React hooks for auth

---

## 🔧 Step-by-Step Integration

### Step 1: Install Dependencies

```bash
npm install axios
```

### Step 2: Create Environment File

Create `.env` in frontend root:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 3: Update Backend CORS

**Backend**: `backend/src/server.ts`

```typescript
app.use(
  cors({
    origin: 'http://localhost:3000', // ⚠️ Change to your frontend URL
    credentials: true, // CRITICAL: Allow cookies
  })
);
```

**If using Vite (port 5173):**
```typescript
origin: 'http://localhost:5173',
```

### Step 4: Wrap App with AuthProvider

**Update `src/main.tsx`:**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

### Step 5: Update Login Component

**Example: Update your login logic in `App.tsx`:**

```typescript
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [appState, setAppState] = useState<AppState>('welcome');

  // Show loading while checking auth
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Auto-redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated && appState === 'welcome') {
      setAppState('dashboard');
    }
  }, [isAuthenticated, appState]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      setAppState('dashboard');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAppState('welcome');
  };

  // Rest of your component...
}
```

---

## 🔐 How Token Refresh Works

### Flow Diagram:

```
1. User logs in
   ↓
2. Backend sends:
   - Access Token (15 min) → localStorage
   - Refresh Token (7 days) → httpOnly cookie
   ↓
3. User makes API call
   ↓
4. Axios adds: Authorization: Bearer <accessToken>
   ↓
5. Token expires (after 15 min)
   ↓
6. API returns 401
   ↓
7. Axios interceptor catches 401
   ↓
8. Calls /api/auth/refresh (sends cookie automatically)
   ↓
9. Backend validates refresh token
   ↓
10. Returns new access token
    ↓
11. Axios saves new token
    ↓
12. Retries original request
    ↓
13. Success! User stays logged in
```

### On Page Refresh:

```
1. Page loads
   ↓
2. AuthContext checks localStorage
   ↓
3. Access token found?
   ├─ Yes → User restored (no API call needed)
   └─ No → Show login
   ↓
4. User makes first API call
   ↓
5. If token expired → Auto-refresh (step 7-13 above)
```

---

## 🧪 Testing the Integration

### Test 1: Check Cookie is Saved

1. Open DevTools → Application → Cookies
2. Login to your app
3. Check for `refreshToken` cookie:
   - ✅ Name: `refreshToken`
   - ✅ Value: JWT token string
   - ✅ HttpOnly: ✓
   - ✅ Expires: 7 days from now
   - ✅ SameSite: Strict/Lax

**If cookie not visible:**
- Check backend CORS: `credentials: true`
- Check frontend axios: `withCredentials: true`
- Check cookie settings in backend

### Test 2: Refresh Works

1. Login to app
2. Open DevTools → Console
3. Run:
```javascript
localStorage.getItem('accessToken')
```
4. Copy the token
5. Wait 15 minutes (or manually delete token)
6. Make any API call (e.g., view trips)
7. Check Network tab:
   - Should see `/auth/refresh` call
   - Should get new access token
   - Original request should succeed

### Test 3: Page Refresh

1. Login to app
2. Navigate to dashboard
3. Press F5 (refresh page)
4. **Expected**: User stays logged in
5. **If logout**: Check console for errors

### Test 4: Manual Refresh Call

Open DevTools Console:

```javascript
// Test refresh endpoint
fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include' // CRITICAL
})
.then(r => r.json())
.then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Cookie Not Saving

**Symptoms:**
- No `refreshToken` in cookies
- Logout on refresh

**Fix:**

**Backend** (`backend/src/server.ts`):
```typescript
app.use(cors({
  origin: 'http://localhost:3000', // Match your frontend URL exactly
  credentials: true
}));
```

**Backend** (`backend/src/config/jwt.ts`):
```typescript
cookie: {
  httpOnly: true,
  secure: false, // Set to true only in production with HTTPS
  sameSite: 'lax', // or 'strict'
  maxAge: 7 * 24 * 60 * 60 * 1000,
}
```

**Frontend** (`src/services/axiosInstance.ts`):
```typescript
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // MUST BE TRUE
});
```

### Issue 2: CORS Error

**Error in Console:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:**

1. **Backend**: Ensure CORS origin matches frontend URL exactly
2. **Frontend**: Ensure `withCredentials: true`
3. **Restart both servers** after changes

### Issue 3: 401 on Refresh

**Symptoms:**
- Refresh endpoint returns 401
- User logged out immediately

**Possible Causes:**

1. **Cookie not sent**: Check `withCredentials: true`
2. **Cookie expired**: Check cookie expiry (should be 7 days)
3. **Token mismatch**: Backend refresh token doesn't match cookie

**Debug:**
```javascript
// Check if cookie is being sent
// Network tab → /auth/refresh → Headers → Request Headers
// Should see: Cookie: refreshToken=...
```

### Issue 4: Infinite Refresh Loop

**Symptoms:**
- Multiple `/auth/refresh` calls
- App freezes

**Fix:**

Check `src/services/axiosInstance.ts`:
```typescript
// Ensure _retry flag is set
originalRequest._retry = true;

// Ensure isRefreshing flag is managed properly
```

---

## 📊 Debugging Checklist

Run through this checklist:

### Backend Checks:

- [ ] MongoDB is running
- [ ] Backend server is running on port 5000
- [ ] CORS origin matches frontend URL
- [ ] `credentials: true` in CORS config
- [ ] Cookie settings correct in `jwt.ts`
- [ ] `/auth/refresh` endpoint works in Postman

### Frontend Checks:

- [ ] `withCredentials: true` in axios config
- [ ] AuthProvider wraps App
- [ ] Environment variables set (`.env`)
- [ ] No console errors
- [ ] `refreshToken` cookie visible in DevTools
- [ ] Access token in localStorage

### Test in Postman:

1. **Login:**
```
POST http://localhost:5000/api/auth/login
Body: { "email": "test@test.com", "password": "password123" }
```

2. **Check Response:**
- Should return access token
- Should set `refreshToken` cookie

3. **Refresh:**
```
POST http://localhost:5000/api/auth/refresh
(No body needed, cookie sent automatically)
```

4. **Should return new access token**

---

## 🚀 Production Deployment

### Backend Changes:

**`.env` (Production):**
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
SOCKET_CORS_ORIGIN=https://yourdomain.com
```

**`backend/src/config/jwt.ts`:**
```typescript
cookie: {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}
```

### Frontend Changes:

**`.env.production`:**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```

---

## 💡 Best Practices

### 1. Token Storage

✅ **DO:**
- Access token → localStorage (short-lived, 15 min)
- Refresh token → httpOnly cookie (long-lived, 7 days)

❌ **DON'T:**
- Store refresh token in localStorage (XSS risk)
- Store tokens in React state only (lost on refresh)

### 2. Error Handling

```typescript
try {
  await login({ email, password });
} catch (error: any) {
  if (error.response?.status === 401) {
    alert('Invalid credentials');
  } else if (error.response?.status === 429) {
    alert('Too many attempts. Try again later.');
  } else {
    alert('Login failed. Please try again.');
  }
}
```

### 3. Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleLogin = async () => {
  setIsLoading(true);
  try {
    await login({ email, password });
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Protected Routes

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Login → Dashboard (no errors)
2. ✅ Refresh page → Still logged in
3. ✅ Close tab → Reopen → Still logged in (within 7 days)
4. ✅ Wait 15 min → Make API call → Auto-refreshes → Works
5. ✅ Cookie visible in DevTools
6. ✅ No CORS errors in console
7. ✅ Network tab shows successful `/auth/refresh` calls

---

## 📞 Still Having Issues?

### Debug Steps:

1. **Check Backend Logs:**
```bash
cd backend
npm run dev
# Watch for errors
```

2. **Check Frontend Console:**
- Any CORS errors?
- Any 401 errors?
- Any network failures?

3. **Test Backend Independently:**
- Use Postman to test all auth endpoints
- Ensure they work before integrating

4. **Check Cookie Settings:**
- DevTools → Application → Cookies
- Verify all cookie properties

5. **Restart Everything:**
```bash
# Backend
cd backend
npm run dev

# Frontend
cd ..
npm run dev
```

---

## 🔥 Quick Fix Checklist

If logout on refresh:

```bash
# 1. Check backend CORS
# backend/src/server.ts
origin: 'http://localhost:3000' # Match your frontend URL

# 2. Check frontend axios
# src/services/axiosInstance.ts
withCredentials: true # MUST BE TRUE

# 3. Check cookie is saved
# DevTools → Application → Cookies → refreshToken

# 4. Restart both servers
# Backend: Ctrl+C, npm run dev
# Frontend: Ctrl+C, npm run dev

# 5. Clear browser cache
# DevTools → Application → Clear storage

# 6. Test login again
```

---

## 📚 Additional Resources

- [JWT Best Practices](https://jwt.io/introduction)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Remember**: 95% of "logout on refresh" issues are due to:
1. Missing `withCredentials: true`
2. CORS origin mismatch
3. Cookie not being saved

Fix these 3 things and it will work! 🚀
