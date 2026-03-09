import mongoose, { Document, Schema } from 'mongoose';

/**
 * Location Interface
 */
interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Harsh Event Interface
 */
interface IHarshEvent {
  type: 'braking' | 'acceleration' | 'cornering' | 'speeding';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  speed?: number;
  gForce?: number;
}

/**
 * Trip Interface
 */
export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  startLocation: ILocation;
  endLocation?: ILocation;
  distance: number; // in kilometers
  duration: number; // in seconds
  safetyScore: number; // 0-100
  harshEvents: IHarshEvent[];
  averageSpeed?: number;
  maxSpeed?: number;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trip Schema
 * Stores trip data including location, metrics, and safety events
 */
const tripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startLocation: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
      address: String,
    },
    endLocation: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
      address: String,
    },
    distance: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    safetyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
    harshEvents: [
      {
        type: {
          type: String,
          enum: ['braking', 'acceleration', 'cornering', 'speeding'],
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          required: true,
        },
        speed: Number,
        gForce: Number,
      },
    ],
    averageSpeed: {
      type: Number,
      min: 0,
    },
    maxSpeed: {
      type: Number,
      min: 0,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ status: 1 });
tripSchema.index({ startTime: -1 });

const Trip = mongoose.model<ITrip>('Trip', tripSchema);

export default Trip;
