export interface Trip {
  id: string;
  date: string;
  distance: number;
  duration: number;
  safetyScore: number;
}

export interface SafetyStats {
  harshBrakes: number;
  harshAcceleration: number;
  overspeedCount: number;
  safetyScore: number;
}

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity?: number;
  precipitation?: number;
  windSpeed?: number;
}

export type AppState = 'welcome' | 'login' | 'dashboard' | 'fleet';

export type UserRole = 'driver' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Crash detection types
export type CrashDetectionSource = 'accelerometer' | 'audio';

export interface CrashEvent {
  id: string;
  timestamp: number;
  source: CrashDetectionSource;
  location?: {
    latitude: number;
    longitude: number;
  };
  severity: 'low' | 'medium' | 'high';
  metadata?: AccelerometerCrashMetadata | AudioCrashMetadata;
}

export interface AccelerometerCrashMetadata {
  gForce: number;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  indicators?: string[];
  confidence?: number;
  indicatorCount?: number;
}

export interface AudioCrashMetadata {
  amplitude: number;
  dominantFrequency: number;
  confidence: number;
  sustainedDuration: number;
  sensitivity: 'low' | 'medium' | 'high';
}
