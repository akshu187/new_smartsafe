import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';

/**
 * MongoDB Database Connection
 * Handles connection, reconnection, and error handling
 */
let reconnectTimeout: NodeJS.Timeout | null = null;
let isConnecting = false;
let listenersAttached = false;
let memoryServer: MongoMemoryServer | null = null;
let usingInMemoryDb = false;

const scheduleReconnect = () => {
  if (reconnectTimeout) {
    return;
  }

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    void connectDatabase();
  }, 15000);
};

const attachConnectionListeners = () => {
  if (listenersAttached) {
    return;
  }

  listenersAttached = true;

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Retrying...');
    scheduleReconnect();
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });
};

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === 1;

const connectInMemoryDatabase = async (): Promise<void> => {
  if (!env.enableInMemoryDbFallback) {
    scheduleReconnect();
    return;
  }

  try {
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'smartsafe',
        },
      });
    }

    const memoryUri = memoryServer.getUri('smartsafe');
    await mongoose.connect(memoryUri);
    usingInMemoryDb = true;
    attachConnectionListeners();
    console.warn('Connected to in-memory MongoDB fallback');
  } catch (fallbackError) {
    console.error('In-memory MongoDB fallback failed:', fallbackError);
    scheduleReconnect();
  }
};

export const connectDatabase = async (): Promise<void> => {
  if (isConnecting || isDatabaseConnected()) {
    return;
  }

  isConnecting = true;

  try {
    const options = {
      autoIndex: !env.isProduction,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      connectTimeoutMS: 5000,
    };

    console.log('Attempting MongoDB connection...');
    usingInMemoryDb = false;

    await mongoose.connect(env.mongoUri, options);

    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);

    attachConnectionListeners();
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    await connectInMemoryDatabase();
  } finally {
    isConnecting = false;
  }
};

export default connectDatabase;
