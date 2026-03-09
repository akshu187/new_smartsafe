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
 * Weather Conditions Interface
 */
interface IWeatherConditions {
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  condition?: string;
}

/**
 * Crash Event Interface
 */
export interface ICrashEvent extends Document {
  userId: mongoose.Types.ObjectId;
  tripId?: mongoose.Types.ObjectId;
  location: ILocation;
  severity: 'low' | 'medium' | 'high';
  indicatorsTriggered: string[];
  confidence: number; // 0-100
  indicatorCount: number;
  gForce?: number;
  speed?: number;
  weatherConditions?: IWeatherConditions;
  sosTriggered: boolean;
  sosSentAt?: Date;
  userCancelled: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Crash Event Schema
 * Stores crash detection events with full details
 */
const crashEventSchema = new Schema<ICrashEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
    },
    location: {
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
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    indicatorsTriggered: {
      type: [String],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    indicatorCount: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    gForce: {
      type: Number,
      min: 0,
    },
    speed: {
      type: Number,
      min: 0,
    },
    weatherConditions: {
      temperature: Number,
      humidity: Number,
      windSpeed: Number,
      condition: String,
    },
    sosTriggered: {
      type: Boolean,
      default: false,
    },
    sosSentAt: {
      type: Date,
    },
    userCancelled: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
crashEventSchema.index({ userId: 1, timestamp: -1 });
crashEventSchema.index({ severity: 1 });
crashEventSchema.index({ sosTriggered: 1 });
crashEventSchema.index({ timestamp: -1 });

const CrashEvent = mongoose.model<ICrashEvent>('CrashEvent', crashEventSchema);

export default CrashEvent;
