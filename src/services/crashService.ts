import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../config/api';

export interface CrashLocation {
  latitude: number;
  longitude: number;
}

export interface CrashReportPayload {
  location: CrashLocation;
  severity: 'low' | 'medium' | 'high';
  indicatorsTriggered: string[];
  confidence: number;
  indicatorCount: number;
  gForce?: number;
  speed?: number;
  weatherConditions?: {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    condition?: string;
  };
  sosTriggered?: boolean;
  sosSentAt?: string;
  userCancelled?: boolean;
  timestamp?: string;
}

const hasAccessToken = (): boolean => !!localStorage.getItem('accessToken');

export const reportCrashEvent = async (
  payload: CrashReportPayload
): Promise<void> => {
  if (!hasAccessToken()) {
    return;
  }

  await axiosInstance.post(API_ENDPOINTS.crashes.base, {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  });
};

