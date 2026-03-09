# SmartSafe Backend - Complete Setup Guide

## 📋 Step-by-Step Installation

### Step 1: Install MongoDB

#### Windows
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a Service
5. Verify installation:
```bash
mongod --version
```

#### macOS (using Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Step 2: Setup Backend

1. **Navigate to backend folder**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Edit .env file** (use any text editor)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartsafe
JWT_ACCESS_SECRET=my-super-secret-access-key-12345
JWT_REFRESH_SECRET=my-super-secret-refresh-key-67890
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
COOKIE_SECRET=my-cookie-secret-key
FRONTEND_URL=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Start the Server

#### Development Mode (with auto-reload)
```bash
npm run dev
```

You should see:
```
🚗 ========================================
🚗   SmartSafe Backend Server Started
🚗 ========================================
📡 Server running on port: 5000
🌍 Environment: development
🔗 API URL: http://localhost:5000
🔌 Socket.io: Enabled
🚗 ========================================
✅ MongoDB connected successfully
📊 Database: smartsafe
✅ Socket.io initialized
```

#### Production Mode
```bash
npm run build
npm start
```

### Step 4: Test the API

#### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "SmartSafe Backend is running",
  "timestamp": "2026-03-02T...",
  "environment": "development"
}
```

#### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Driver",
    "email": "driver@test.com",
    "password": "password123",
    "role": "driver"
  }'
```

Expected response:
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

## 🔗 Connecting Frontend to Backend

### Update Frontend API Configuration

Create `src/config/api.ts` in your frontend:

```typescript
export const API_BASE_URL = 'http://localhost:5000/api';
export const SOCKET_URL = 'http://localhost:5000';

export const api = {
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    logout: `${API_BASE_URL}/auth/logout`,
  },
  users: {
    me: `${API_BASE_URL}/users/me`,
  },
  trips: {
    base: `${API_BASE_URL}/trips`,
    byId: (id: string) => `${API_BASE_URL}/trips/${id}`,
  },
  crashes: {
    base: `${API_BASE_URL}/crashes`,
    byId: (id: string) => `${API_BASE_URL}/crashes/${id}`,
  },
  fleet: {
    drivers: `${API_BASE_URL}/fleet/drivers`,
    rankings: `${API_BASE_URL}/fleet/rankings`,
  },
};
```

### Example: Login API Call

```typescript
// src/services/authService.ts
import axios from 'axios';
import { api } from '../config/api';

export const login = async (email: string, password: string) => {
  const response = await axios.post(
    api.auth.login,
    { email, password },
    { withCredentials: true } // Important for cookies
  );
  
  return response.data;
};
```

### Example: Protected API Call

```typescript
// src/services/tripService.ts
import axios from 'axios';
import { api } from '../config/api';

const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const createTrip = async (tripData: any) => {
  const response = await axios.post(
    api.trips.base,
    tripData,
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      withCredentials: true,
    }
  );
  
  return response.data;
};
```

### Example: Socket.io Connection

```typescript
// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

let socket: Socket | null = null;

export const connectSocket = (accessToken: string) => {
  socket = io(SOCKET_URL, {
    auth: {
      token: accessToken,
    },
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  return socket;
};

export const sendLocationUpdate = (location: any) => {
  if (socket) {
    socket.emit('driverLocationUpdate', location);
  }
};

export const listenForCrashes = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('crashDetected', callback);
  }
};
```

## 🔐 Authentication Flow in Frontend

### 1. Login Component

```typescript
import { useState } from 'react';
import { login } from '../services/authService';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await login(email, password);
      
      // Store access token
      localStorage.setItem('accessToken', response.data.accessToken);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### 2. Axios Interceptor for Auto Token Refresh

```typescript
// src/config/axios.ts
import axios from 'axios';
import { API_BASE_URL } from './api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor - Add access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Update access token
        const newAccessToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### 3. Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

## 📊 Database Management

### View Data in MongoDB

```bash
# Open MongoDB shell
mongosh

# Switch to smartsafe database
use smartsafe

# View all users
db.users.find().pretty()

# View all trips
db.trips.find().pretty()

# View all crash events
db.crashevents.find().pretty()

# Count documents
db.users.countDocuments()
db.trips.countDocuments()

# Delete all data (be careful!)
db.users.deleteMany({})
db.trips.deleteMany({})
db.crashevents.deleteMany({})
```

### MongoDB Compass (GUI Tool)

1. Download from: https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. Browse `smartsafe` database visually

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Failed
**Error**: `MongoServerError: connect ECONNREFUSED`

**Solution**:
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
# Windows: Start MongoDB service from Services
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongodb
```

### Issue 2: Port 5000 Already in Use
**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
# Windows:
netstat -ano | findstr :5000

# macOS/Linux:
lsof -ti:5000

# Kill the process
# Windows:
taskkill /PID <PID> /F

# macOS/Linux:
kill -9 <PID>

# Or change PORT in .env file
PORT=5001
```

### Issue 3: CORS Error in Frontend
**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Check that `withCredentials: true` is set in axios calls
- Restart backend server after changing `.env`

### Issue 4: JWT Token Expired
**Error**: `Token expired or invalid`

**Solution**:
- Implement auto-refresh using axios interceptor (see above)
- Or manually call `/api/auth/refresh` endpoint
- Ensure refresh token cookie is being sent

## 🚀 Production Deployment

### Using MongoDB Atlas (Cloud)

1. Create account at: https://www.mongodb.com/cloud/atlas
2. Create a cluster (free tier available)
3. Get connection string
4. Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartsafe?retryWrites=true&w=majority
```

### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create smartsafe-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set JWT_ACCESS_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-secret
heroku config:set FRONTEND_URL=https://your-frontend-domain.com

# Deploy
git push heroku main
```

### Deploy to DigitalOcean/AWS

1. Create a server (Ubuntu 20.04+)
2. Install Node.js and MongoDB
3. Clone repository
4. Install dependencies: `npm install`
5. Build: `npm run build`
6. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start dist/server.js --name smartsafe-backend
pm2 startup
pm2 save
```

## 📞 Support

For issues, please check:
1. MongoDB is running
2. `.env` file is configured correctly
3. All dependencies are installed
4. Port is not in use

Still having issues? Check the logs in the terminal for detailed error messages.
