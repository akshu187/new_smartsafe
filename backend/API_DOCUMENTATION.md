# SmartSafe Backend - API Documentation

Base URL: `http://localhost:5000/api`

## 📋 Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Trips](#trips)
- [Crash Events](#crash-events)
- [Fleet Management](#fleet-management)
- [Socket.io Events](#socketio-events)

---

## 🔐 Authentication

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "driver" // Optional: "admin" or "driver" (default: "driver")
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "65f1234567890abcdef12345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "driver",
      "createdAt": "2026-03-02T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Set:**
- `refreshToken` (httpOnly, 7 days)

---

### Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65f1234567890abcdef12345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "driver"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Set:**
- `refreshToken` (httpOnly, 7 days)

---

### Refresh Access Token
**POST** `/auth/refresh`

**Cookies Required:**
- `refreshToken`

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Updated:**
- `refreshToken` (new token, httpOnly, 7 days)

---

### Logout User
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

**Cookies Cleared:**
- `refreshToken`

---

## 👤 Users

### Get Current User Profile
**GET** `/users/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "_id": "65f1234567890abcdef12345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "driver",
      "createdAt": "2026-03-02T10:00:00.000Z",
      "updatedAt": "2026-03-02T10:00:00.000Z"
    }
  }
}
```

---

## 🚗 Trips

### Create Trip
**POST** `/trips`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "startLocation": {
    "latitude": 29.8543,
    "longitude": 77.8880,
    "address": "Roorkee, Uttarakhand" // Optional
  },
  "endLocation": { // Optional
    "latitude": 29.8700,
    "longitude": 77.9100,
    "address": "Haridwar Road"
  },
  "distance": 12.5, // km
  "duration": 1800, // seconds
  "safetyScore": 95, // 0-100
  "harshEvents": [ // Optional
    {
      "type": "braking",
      "timestamp": "2026-03-02T10:30:00.000Z",
      "severity": "medium",
      "speed": 60,
      "gForce": 4.2
    }
  ],
  "averageSpeed": 45, // Optional
  "maxSpeed": 80, // Optional
  "status": "completed" // "active" or "completed"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "trip": {
      "_id": "65f1234567890abcdef12346",
      "userId": "65f1234567890abcdef12345",
      "startLocation": {
        "latitude": 29.8543,
        "longitude": 77.8880,
        "address": "Roorkee, Uttarakhand"
      },
      "distance": 12.5,
      "duration": 1800,
      "safetyScore": 95,
      "status": "completed",
      "createdAt": "2026-03-02T10:00:00.000Z"
    }
  }
}
```

---

### Get All Trips
**GET** `/trips?page=1&limit=10&status=completed`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `status` (optional, filter by "active" or "completed")

**Response (200):**
```json
{
  "success": true,
  "message": "Trips retrieved successfully",
  "data": [
    {
      "_id": "65f1234567890abcdef12346",
      "userId": "65f1234567890abcdef12345",
      "startLocation": {
        "latitude": 29.8543,
        "longitude": 77.8880
      },
      "distance": 12.5,
      "duration": 1800,
      "safetyScore": 95,
      "status": "completed",
      "createdAt": "2026-03-02T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### Get Trip by ID
**GET** `/trips/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip retrieved successfully",
  "data": {
    "trip": {
      "_id": "65f1234567890abcdef12346",
      "userId": "65f1234567890abcdef12345",
      "startLocation": {
        "latitude": 29.8543,
        "longitude": 77.8880
      },
      "endLocation": {
        "latitude": 29.8700,
        "longitude": 77.9100
      },
      "distance": 12.5,
      "duration": 1800,
      "safetyScore": 95,
      "harshEvents": [],
      "status": "completed",
      "createdAt": "2026-03-02T10:00:00.000Z"
    }
  }
}
```

---

### Update Trip
**PUT** `/trips/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:** (any trip fields to update)
```json
{
  "endLocation": {
    "latitude": 29.8700,
    "longitude": 77.9100
  },
  "distance": 15.2,
  "status": "completed"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip updated successfully",
  "data": {
    "trip": { /* updated trip object */ }
  }
}
```

---

### Delete Trip
**DELETE** `/trips/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Trip deleted successfully",
  "data": null
}
```

---

## 🚨 Crash Events

### Create Crash Event
**POST** `/crashes`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "tripId": "65f1234567890abcdef12346", // Optional
  "location": {
    "latitude": 29.8543,
    "longitude": 77.8880,
    "address": "NH-58, Roorkee" // Optional
  },
  "severity": "high", // "low", "medium", or "high"
  "indicatorsTriggered": [
    "High G-Force (>4.0)",
    "Sudden Deceleration",
    "Crash Sound Detected",
    "Rapid Rotation/Rollover"
  ],
  "confidence": 80, // 0-100
  "indicatorCount": 8,
  "gForce": 5.2, // Optional
  "speed": 65, // Optional
  "weatherConditions": { // Optional
    "temperature": 25,
    "humidity": 60,
    "windSpeed": 15,
    "condition": "Clear"
  },
  "sosTriggered": true,
  "sosSentAt": "2026-03-02T10:35:00.000Z", // Optional
  "userCancelled": false,
  "timestamp": "2026-03-02T10:30:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Crash event created successfully",
  "data": {
    "crashEvent": {
      "_id": "65f1234567890abcdef12347",
      "userId": "65f1234567890abcdef12345",
      "location": {
        "latitude": 29.8543,
        "longitude": 77.8880
      },
      "severity": "high",
      "indicatorsTriggered": [
        "High G-Force (>4.0)",
        "Sudden Deceleration"
      ],
      "confidence": 80,
      "sosTriggered": true,
      "createdAt": "2026-03-02T10:30:00.000Z"
    }
  }
}
```

---

### Get All Crash Events
**GET** `/crashes?page=1&limit=10&severity=high&sosTriggered=true`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `severity` (optional, filter by "low", "medium", or "high")
- `sosTriggered` (optional, filter by true/false)

**Response (200):**
```json
{
  "success": true,
  "message": "Crash events retrieved successfully",
  "data": [
    {
      "_id": "65f1234567890abcdef12347",
      "userId": "65f1234567890abcdef12345",
      "location": {
        "latitude": 29.8543,
        "longitude": 77.8880
      },
      "severity": "high",
      "confidence": 80,
      "sosTriggered": true,
      "timestamp": "2026-03-02T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### Get Crash Event by ID
**GET** `/crashes/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Crash event retrieved successfully",
  "data": {
    "crashEvent": { /* full crash event object */ }
  }
}
```

---

### Update Crash Event
**PUT** `/crashes/:id`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "sosTriggered": true,
  "sosSentAt": "2026-03-02T10:35:00.000Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Crash event updated successfully",
  "data": {
    "crashEvent": { /* updated crash event */ }
  }
}
```

---

## 👥 Fleet Management (Admin Only)

### Get All Drivers with Stats
**GET** `/fleet/drivers`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Role Required:** `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "Drivers retrieved successfully",
  "data": {
    "drivers": [
      {
        "_id": "65f1234567890abcdef12345",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "driver",
        "stats": {
          "totalTrips": 25,
          "totalDistance": 450.5,
          "averageSafetyScore": 92,
          "totalCrashes": 2
        }
      }
    ]
  }
}
```

---

### Get Driver Rankings
**GET** `/fleet/rankings`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Role Required:** `admin`

**Response (200):**
```json
{
  "success": true,
  "message": "Driver rankings retrieved successfully",
  "data": {
    "rankings": [
      {
        "driverId": "65f1234567890abcdef12345",
        "name": "John Doe",
        "email": "john@example.com",
        "safetyScore": 95,
        "totalTrips": 30,
        "totalCrashes": 1,
        "totalHarshEvents": 5
      },
      {
        "driverId": "65f1234567890abcdef12346",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "safetyScore": 88,
        "totalTrips": 20,
        "totalCrashes": 3,
        "totalHarshEvents": 12
      }
    ]
  }
}
```

---

## 🔌 Socket.io Events

### Connection

**Client Side:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: accessToken // JWT access token
  }
});

socket.on('connect', () => {
  console.log('Connected to server');
});
```

---

### Driver Location Update

**Client → Server:**
```javascript
socket.emit('driverLocationUpdate', {
  latitude: 29.8543,
  longitude: 77.8880,
  speed: 45,
  heading: 180
});
```

**Server → Admins:**
```javascript
socket.on('driverLocationUpdate', (data) => {
  console.log('Driver location:', data);
  // {
  //   driverId: "65f1234567890abcdef12345",
  //   latitude: 29.8543,
  //   longitude: 77.8880,
  //   speed: 45,
  //   heading: 180,
  //   timestamp: "2026-03-02T10:30:00.000Z"
  // }
});
```

---

### Crash Detected

**Client → Server:**
```javascript
socket.emit('crashDetected', {
  location: {
    latitude: 29.8543,
    longitude: 77.8880
  },
  severity: 'high',
  confidence: 85,
  indicatorCount: 7
});
```

**Server → Admins:**
```javascript
socket.on('crashDetected', (data) => {
  console.log('Crash detected:', data);
  // {
  //   driverId: "65f1234567890abcdef12345",
  //   location: { latitude: 29.8543, longitude: 77.8880 },
  //   severity: 'high',
  //   confidence: 85,
  //   timestamp: "2026-03-02T10:30:00.000Z"
  // }
});
```

---

### Safety Score Update

**Client → Server:**
```javascript
socket.emit('safetyScoreUpdate', {
  safetyScore: 92,
  tripId: "65f1234567890abcdef12346"
});
```

**Server → Admins:**
```javascript
socket.on('safetyScoreUpdate', (data) => {
  console.log('Safety score updated:', data);
});
```

---

### Trip Started

**Client → Server:**
```javascript
socket.emit('tripStarted', {
  tripId: "65f1234567890abcdef12346",
  startLocation: {
    latitude: 29.8543,
    longitude: 77.8880
  }
});
```

---

### Trip Ended

**Client → Server:**
```javascript
socket.emit('tripEnded', {
  tripId: "65f1234567890abcdef12346",
  distance: 12.5,
  duration: 1800,
  safetyScore: 95
});
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Not authorized, no token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Role 'driver' is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Server Error"
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens are stored in httpOnly cookies
- All protected routes require `Authorization: Bearer <token>` header
- Admin routes require user role to be "admin"
- Pagination defaults: page=1, limit=10
- Socket.io requires JWT token in auth object during connection
