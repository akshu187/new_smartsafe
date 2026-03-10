import express, { Application } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

// Load environment variables before reading config
dotenv.config();

import { env } from './config/env';
import connectDatabase, { isDatabaseConnected } from './config/database';
import { initializeSocket } from './services/socketService';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import tripRoutes from './routes/tripRoutes';
import crashRoutes from './routes/crashRoutes';
import fleetRoutes from './routes/fleetRoutes';
import accidentZoneRoutes from './routes/accidentZoneRoutes';

import { errorHandler, notFound } from './utils/errorHandler';
import { requireDatabaseConnection } from './middleware/requireDatabase';

const app: Application = express();
const server = http.createServer(app);

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || env.frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
};

void connectDatabase();

initializeSocket(server);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.get('/health', (_req, res) => {
  const dbConnected = isDatabaseConnected();
  res.status(200).json({
    success: true,
    message: 'SmartSafe Backend is running',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    database: {
      connected: dbConnected,
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name || null,
    },
  });
});

app.get('/ready', (_req, res) => {
  const dbConnected = isDatabaseConnected();
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? 'Service is ready' : 'Service is not ready',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    database: {
      connected: dbConnected,
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name || null,
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/accident-zones', accidentZoneRoutes);
app.use('/api/', requireDatabaseConnection);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/crashes', crashRoutes);
app.use('/api/fleet', fleetRoutes);

app.use(notFound);
app.use(errorHandler);

const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (error) {
      console.error('Error while closing MongoDB connection:', error);
    } finally {
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000).unref();
};

server.listen(env.port, () => {
  console.log('========================================');
  console.log('SmartSafe Backend Server Started');
  console.log('========================================');
  console.log(`Server running on port: ${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
  console.log(`Allowed origins: ${env.frontendOrigins.join(', ')}`);
  console.log('Socket.io: Enabled');
  console.log('========================================');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  void shutdown('unhandledRejection');
});

process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;
