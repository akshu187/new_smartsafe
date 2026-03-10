# SmartSafe Backend API

Production-ready backend for SmartSafe road safety system built with Node.js, Express, TypeScript, MongoDB, and Socket.io.

## 🚀 Features

- ✅ JWT Authentication (Access + Refresh tokens)
- ✅ Role-based authorization (Admin/Driver)
- ✅ MongoDB with Mongoose ODM
- ✅ Real-time updates with Socket.io
- ✅ Trip tracking and analytics
- ✅ Crash event management
- ✅ Fleet management dashboard
- ✅ Input validation
- ✅ Error handling
- ✅ Rate limiting
- ✅ Security best practices

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm >= 9.0.0

## 🛠 Installation

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

4. **Configure environment variables**
Edit `.env` file with your settings:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartsafe
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:3000
```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### User
- `GET /api/users/me` - Get current user profile

### Trips
- `POST /api/trips` - Create new trip
- `GET /api/trips` - Get all trips (paginated)
- `GET /api/trips/:id` - Get trip by ID
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Crash Events
- `POST /api/crashes` - Create crash event
- `GET /api/crashes` - Get all crash events (paginated)
- `GET /api/crashes/:id` - Get crash event by ID
- `PUT /api/crashes/:id` - Update crash event

### Fleet (Admin Only)
- `GET /api/fleet/drivers` - Get all drivers with stats
- `GET /api/fleet/rankings` - Get driver rankings by safety score

### Accident Zones
- `GET /api/accident-zones?lat=<latitude>&lon=<longitude>&radius=<km>&includeLive=true`
  - Returns merged `historical_blackspot` + optional `live_incident` zones.
  - `includeLive=false` forces historical-only response.
  - Response includes `data.meta` with provider state and fallback reason.

## 🔌 Socket.io Events

### Client → Server
- `driverLocationUpdate` - Driver sends location update
- `crashDetected` - Crash detection event
- `safetyScoreUpdate` - Safety score update
- `tripStarted` - Trip started event
- `tripEnded` - Trip ended event

### Server → Client
- `driverLocationUpdate` - Broadcast to admins
- `crashDetected` - Broadcast to admins
- `safetyScoreUpdate` - Broadcast to admins
- `tripStarted` - Broadcast to admins
- `tripEnded` - Broadcast to admins

## 🔐 Authentication Flow

1. **Register/Login** → Receive access token + refresh token (httpOnly cookie)
2. **API Requests** → Send access token in `Authorization: Bearer <token>` header
3. **Token Expired** → Call `/api/auth/refresh` to get new access token
4. **Logout** → Call `/api/auth/logout` to clear tokens

## 📊 Database Models

### User
- name, email, password (hashed)
- role (admin/driver)
- refreshToken

### Trip
- userId, startLocation, endLocation
- distance, duration, safetyScore
- harshEvents, averageSpeed, maxSpeed
- status (active/completed)

### CrashEvent
- userId, tripId, location
- severity, indicatorsTriggered
- confidence, indicatorCount
- gForce, speed, weatherConditions
- sosTriggered, userCancelled

## 🛡 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT with short-lived access tokens
- ✅ Refresh tokens in httpOnly cookies
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ Input validation
- ✅ MongoDB injection prevention

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point
├── .env.example         # Environment template
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── README.md           # This file
```

## 🧪 Testing

```bash
npm test
```

## 📦 Deployment

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use MongoDB Atlas connection string
- Use strong JWT secrets
- Enable HTTPS
- Configure CORS for production domain
- Set `TRUST_PROXY=true` when running behind Railway proxy
- Set `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none` for HTTPS frontend
- Enable live incident integration:
  - `ENABLE_LIVE_INCIDENT_FETCH=true`
  - `LIVE_INCIDENT_PROVIDER=tomtom`
  - `TOMTOM_API_KEY=<your_key>`

### Railway Deployment Notes
- A Railway config is included at:
  - repo root: `railway.json` (for deploying from monorepo root)
  - backend folder: `backend/railway.json` (for deploying backend as root directory)
- Health check endpoint is `/health` (always 200 if server process is alive).
- Readiness endpoint is `/ready` (200 only when MongoDB is connected).

## 🔧 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- For MongoDB Atlas, whitelist your IP

### Port Already in Use
- Change PORT in `.env`
- Kill process using port: `lsof -ti:5000 | xargs kill`

### JWT Token Errors
- Ensure JWT secrets are set in `.env`
- Check token expiry times
- Clear cookies and re-login

## 📝 License

MIT

## 👥 Support

For issues and questions, please open an issue on GitHub.
