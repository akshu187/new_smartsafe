import { useState, useCallback } from 'react';
import type { Trip } from '../types';

export interface ReportConfig {
  driverId: string;
  driverName: string;
  driverEmail: string;
  dateRange: {
    start: string;
    end: string;
  };
  includeTrips: boolean;
  includeCrashEvents: boolean;
  includeScoreHistory: boolean;
  format: 'pdf' | 'csv';
}

export interface ReportSummary {
  totalDistance: number;
  totalTrips: number;
  averageSpeed: number;
  safetyScore: number;
  crashCount: number;
}

export interface SafetyScoreHistoryEntry {
  date: string;
  score: number;
}

export interface InsuranceReport {
  id: string;
  driverId: string;
  generatedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  verificationCode: string;
  driverInfo: {
    name: string;
    email: string;
    driverId: string;
  };
  summary: ReportSummary;
  trips: Trip[];
  safetyScoreHistory: SafetyScoreHistoryEntry[];
  format: 'pdf' | 'csv';
}

interface UseInsuranceReportReturn {
  isGenerating: boolean;
  error: string | null;
  generateReport: (config: ReportConfig) => Promise<InsuranceReport>;
  getReportHistory: (driverId: string) => InsuranceReport[];
  clearError: () => void;
}

const STORAGE_KEY_PREFIX = 'smartsafe_reports_';
const TRIPS_STORAGE_KEY = 'smartsafe_trips';

/**
 * Generate a verification code for report authenticity
 */
function generateVerificationCode(driverId: string, summary: ReportSummary, timestamp: number): string {
  const data = `${driverId}-${summary.totalTrips}-${summary.safetyScore}-${timestamp}`;
  
  // Simple hash function (in production, use a proper cryptographic hash)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
}

/**
 * Get trips from localStorage filtered by date range
 */
function getTripsInDateRange(driverId: string, startDate: string, endDate: string): Trip[] {
  try {
    const tripsData = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!tripsData) return [];
    
    const allTrips: Trip[] = JSON.parse(tripsData);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return allTrips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate >= start && tripDate <= end;
    });
  } catch (err) {
    console.error('Failed to load trips:', err);
    return [];
  }
}

/**
 * Get safety score history from localStorage
 */
function getSafetyScoreHistory(driverId: string, startDate: string, endDate: string): SafetyScoreHistoryEntry[] {
  try {
    const historyKey = `smartsafe_risk_history_${driverId}`;
    const historyData = localStorage.getItem(historyKey);
    if (!historyData) return [];
    
    const history = JSON.parse(historyData);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return history
      .filter((entry: any) => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      })
      .map((entry: any) => ({
        date: entry.date,
        score: entry.safetyScore
      }));
  } catch (err) {
    console.error('Failed to load safety score history:', err);
    return [];
  }
}

/**
 * Calculate summary statistics from trips
 */
function calculateSummary(trips: Trip[], safetyScoreHistory: SafetyScoreHistoryEntry[]): ReportSummary {
  const totalDistance = trips.reduce((sum, trip) => sum + trip.distance, 0);
  const totalTrips = trips.length;
  
  // Calculate average speed (assuming duration is in seconds)
  const totalDuration = trips.reduce((sum, trip) => sum + trip.duration, 0);
  const averageSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / 3600)) : 0;
  
  // Get latest safety score
  const safetyScore = safetyScoreHistory.length > 0
    ? safetyScoreHistory[safetyScoreHistory.length - 1].score
    : trips.length > 0
    ? trips[trips.length - 1].safetyScore
    : 0;
  
  // Count crash events (using trip safety score as proxy)
  const crashCount = trips.filter(trip => trip.safetyScore < 70).length;
  
  return {
    totalDistance,
    totalTrips,
    averageSpeed,
    safetyScore,
    crashCount
  };
}

/**
 * Save report to history
 */
function saveReportToHistory(report: InsuranceReport): void {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${report.driverId}`;
    const existingData = localStorage.getItem(storageKey);
    const reports: InsuranceReport[] = existingData ? JSON.parse(existingData) : [];
    
    reports.push(report);
    
    // Keep only last 50 reports
    const trimmedReports = reports.slice(-50);
    
    localStorage.setItem(storageKey, JSON.stringify(trimmedReports));
  } catch (err) {
    console.error('Failed to save report to history:', err);
  }
}

export function useInsuranceReport(): UseInsuranceReportReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (config: ReportConfig): Promise<InsuranceReport> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get trips in date range
      const trips = getTripsInDateRange(config.driverId, config.dateRange.start, config.dateRange.end);
      
      // Get safety score history
      const safetyScoreHistory = getSafetyScoreHistory(
        config.driverId,
        config.dateRange.start,
        config.dateRange.end
      );

      // Calculate summary
      const summary = calculateSummary(trips, safetyScoreHistory);

      // Generate verification code
      const timestamp = Date.now();
      const verificationCode = generateVerificationCode(config.driverId, summary, timestamp);

      // Create report
      const report: InsuranceReport = {
        id: `report-${timestamp}`,
        driverId: config.driverId,
        generatedAt: new Date().toISOString(),
        dateRange: config.dateRange,
        verificationCode,
        driverInfo: {
          name: config.driverName,
          email: config.driverEmail,
          driverId: config.driverId
        },
        summary,
        trips: config.includeTrips ? trips : [],
        safetyScoreHistory: config.includeScoreHistory ? safetyScoreHistory : [],
        format: config.format
      };

      // Save to history
      saveReportToHistory(report);

      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getReportHistory = useCallback((driverId: string): InsuranceReport[] => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${driverId}`;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Failed to load report history:', err);
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    error,
    generateReport,
    getReportHistory,
    clearError
  };
}
