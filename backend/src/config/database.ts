import mongoose from 'mongoose';
import { env } from './env';

/**
 * MongoDB Database Connection
 * Handles connection, reconnection, and error handling
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const options = {
      autoIndex: !env.isProduction,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    };

    console.log('Attempting MongoDB connection...');

    await mongoose.connect(env.mongoUri, options);

    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Mongoose will attempt to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDatabase;
