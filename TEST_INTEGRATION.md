# Integration Testing Guide

## 🧪 Quick Test Script

Follow these steps to verify everything is working:

---

## Step 1: Start Backend

```bash
cd backend
npm run dev
```

**Expected Output:**
```
🚗 ========================================
🚗   SmartSafe Backend Server Started
🚗 ========================================
📡 Server running on port: 5000
✅ MongoDB connected successfully
✅ Socket.io initialized
```

---

## Step 2: Start Frontend

```bash
# In new terminal
npm run dev
```

**Expected Output:**
```
VITE v6.x.x ready in xxx ms
➜  Local:   http://localhost:3000/
```

---

## Step 3: Test Cookie Setup

### Open Browser DevTools

1. Go to `http://localhost:3000`
2. Open DevTools (F12)
3. Go to **Application** tab
4. Click **Cookies** → `http://localhost:3000`

**Expected**: Empty (no cookies yet)

---

## Step 4: Test Registration

### In Browser Console:

```javascript
// Test registration
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // CRITICAL
  body: JSON.stringify({
    name: 'Test Driver',
    email: 'driver@test.com',
    password: 'password123',
    role: 'driver'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Registration Success:', data);
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('user', JSON.stringify(data.data.user));
})
.catch(err => console.error('❌ Registration Failed:', err));
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Test Driver",
      "email": "driver@test.com",
      "role": "driver"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Check Cookies Again:

**Application → Cookies → `http://localhost:3000`**

**Expected:**
- ✅ `refreshToken` cookie visible
- ✅ HttpOnly: ✓
- ✅ Expires: 7 days from now

---

## Step 5: Test Refresh Token

### In Browser Console:

```javascript
// Test refresh endpoint
fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  credentials: 'include' // Sends cookie automatically
})
.then(r => r.json())
.then(data => {
  console.log('✅ Refresh Success:', data);
  console.log('New Access Token:', data.data.accessToken);
})
.catch(err => console.error('❌ Refresh Failed:', err));
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

## Step 6: Test Protected Endpoint

### In Browser Console:

```javascript
// Get current user profile
const token = localStorage.getItem('accessToken');

fetch('http://localhost:5000/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('✅ User Profile:', data))
.catch(err => console.error('❌ Failed:', err));
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Test Driver",
      "email": "driver@test.com",
      "role": "driver"
    }
  }
}
```

---

## Step 7: Test Page Refresh

1. **Refresh the page** (F5)
2. **Check localStorage:**
```javascript
localStorage.getItem('accessToken')
localStorage.getItem('user')
```

**Expected:**
- ✅ Both still present
- ✅ User data intact

3. **Make API call again:**
```javascript
const token = localStorage.getItem('accessToken');

fetch('http://localhost:5000/api/users/me', {
  headers: { 'Authorization': `Bearer ${token}` },
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('✅ Still works after refresh:', data));
```

---

## Step 8: Test Auto Token Refresh

### Simulate Token Expiry:

```javascript
// Delete access token (simulate expiry)
localStorage.removeItem('accessToken');

// Try to access protected endpoint
fetch('http://localhost:5000/api/users/me', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

**Expected:**
- ❌ First call fails with 401
- ✅ Axios interceptor should catch it
- ✅ Auto-refresh should happen
- ✅ Request should retry and succeed

**Check Network Tab:**
- Should see `/auth/refresh` call
- Should see original request retry

---

## Step 9: Test Logout

### In Browser Console:

```javascript
const token = localStorage.getItem('accessToken');

fetch('http://localhost:5000/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('✅ Logout Success:', data);
  localStorage.clear();
})
.catch(err => console.error('❌ Logout Failed:', err));
```

**Expected:**
- ✅ Logout successful
- ✅ `refreshToken` cookie deleted
- ✅ localStorage cleared

---

## Step 10: Test with Frontend UI

### Update App.tsx to use AuthContext:

```typescript
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log('Current User:', user);
  console.log('Is Authenticated:', !!user);

  // Rest of your component...
}
```

### Test Flow:

1. **Login via UI**
   - Enter email/password
   - Click login
   - Should redirect to dashboard

2. **Check Console:**
   - `Current User:` should show user object
   - `Is Authenticated:` should be true

3. **Refresh Page (F5)**
   - Should stay logged in
   - User object should persist

4. **Close Tab → Reopen**
   - Should still be logged in (within 7 days)

5. **Logout**
   - Click logout button
   - Should redirect to welcome page
   - User should be null

---

## ✅ Success Checklist

Mark each as you test:

### Backend Tests:
- [ ] Backend starts without errors
- [ ] MongoDB connected
- [ ] Health check works: `http://localhost:5000/health`
- [ ] Registration endpoint works
- [ ] Login endpoint works
- [ ] Refresh endpoint works
- [ ] Logout endpoint works

### Cookie Tests:
- [ ] `refreshToken` cookie is set after login
- [ ] Cookie is httpOnly
- [ ] Cookie expires in 7 days
- [ ] Cookie is sent with requests

### Frontend Tests:
- [ ] Frontend starts without errors
- [ ] No CORS errors in console
- [ ] Login works via UI
- [ ] User stays logged in after refresh
- [ ] Logout works
- [ ] Auto-refresh works (test by deleting access token)

### Integration Tests:
- [ ] Login → Dashboard → Refresh → Still logged in
- [ ] Login → Close tab → Reopen → Still logged in
- [ ] Login → Wait 15 min → Make API call → Auto-refreshes
- [ ] Logout → Cookies cleared → Redirected to login

---

## 🐛 Common Test Failures

### Test Fails: Cookie Not Set

**Check:**
1. Backend CORS: `credentials: true`
2. Frontend axios: `withCredentials: true`
3. Cookie settings in `backend/src/config/jwt.ts`

**Fix:**
```typescript
// Backend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Frontend
axios.create({
  withCredentials: true
});
```

### Test Fails: 401 on Refresh

**Check:**
1. Cookie is being sent (Network tab → Headers → Cookie)
2. Refresh token matches in database
3. Token not expired

**Debug:**
```javascript
// Check cookie value
document.cookie
```

### Test Fails: CORS Error

**Check:**
1. Backend origin matches frontend URL exactly
2. Both servers running
3. No typos in URLs

**Fix:**
```typescript
// Backend - match your frontend port
origin: 'http://localhost:3000' // or 5173 for Vite
```

---

## 📊 Expected Network Calls

### On Login:
```
POST /api/auth/login
Status: 200
Response: { accessToken, user }
Cookies Set: refreshToken
```

### On Page Load (Authenticated):
```
No API calls needed!
User restored from localStorage
```

### On First API Call After Refresh:
```
GET /api/users/me
Status: 200
Headers: Authorization: Bearer <token>
```

### On Token Expiry:
```
1. GET /api/users/me
   Status: 401

2. POST /api/auth/refresh (automatic)
   Status: 200
   Response: { accessToken }

3. GET /api/users/me (retry)
   Status: 200
```

### On Logout:
```
POST /api/auth/logout
Status: 200
Cookies Cleared: refreshToken
```

---

## 🎉 All Tests Passed?

If all tests pass, your integration is complete! 🚀

You now have:
- ✅ Persistent login (survives refresh)
- ✅ Auto token refresh
- ✅ Secure cookie-based refresh tokens
- ✅ Proper CORS setup
- ✅ Production-ready auth flow

---

## 📞 Need Help?

If any test fails:

1. Check the specific section in `FRONTEND_BACKEND_INTEGRATION.md`
2. Review console errors
3. Check Network tab for failed requests
4. Verify all environment variables
5. Restart both servers

**Most common fix**: Ensure `withCredentials: true` everywhere!
