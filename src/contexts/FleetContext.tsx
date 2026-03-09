import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Trip, SafetyStats } from '../types';
import { setCache, getCache, getCacheOrFetch } from '../utils/cache';

export interface Driver {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'invited';
  safetyScore: number;
  riskRank: number;
  trips: Trip[];
  stats: SafetyStats;
  joinedDate: string;
}

export interface Fleet {
  id: string;
  name: string;
  adminId: string;
  drivers: Driver[];
  createdDate: string;
}

export interface FleetAnalytics {
  totalDistance: number;
  totalTrips: number;
  averageSafetyScore: number;
  crashEventFrequency: number;
  dateRange: {
    start: string;
    end: string;
  };
}

interface FleetContextValue {
  fleet: Fleet | null;
  analytics: FleetAnalytics | null;
  isLoading: boolean;
  error: string | null;
  addDriver: (driver: Omit<Driver, 'id' | 'joinedDate'>) => void;
  removeDriver: (driverId: string) => void;
  updateDriver: (driverId: string, updates: Partial<Driver>) => void;
  getDriver: (driverId: string) => Driver | undefined;
  calculateAnalytics: (startDate?: string, endDate?: string) => FleetAnalytics;
  refreshFleet: () => void;
}

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

const STORAGE_KEY = 'smartsafe_fleet_data';
const ANALYTICS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache for analytics

interface FleetProviderProps {
  children: ReactNode;
  adminId?: string;
}

export function FleetProvider({ children, adminId = 'admin-1' }: FleetProviderProps) {
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [analytics, setAnalytics] = useState<FleetAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load fleet data from localStorage
  const loadFleetData = () => {
    try {
      setIsLoading(true);
      const savedData = localStorage.getItem(STORAGE_KEY);
      
      if (savedData) {
        const parsedFleet: Fleet = JSON.parse(savedData);
        setFleet(parsedFleet);
      } else {
        // Initialize empty fleet
        const newFleet: Fleet = {
          id: `fleet-${Date.now()}`,
          name: 'My Fleet',
          adminId,
          drivers: [],
          createdDate: new Date().toISOString()
        };
        setFleet(newFleet);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFleet));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load fleet data');
      console.error('Fleet data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save fleet data to localStorage
  const saveFleetData = (updatedFleet: Fleet) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFleet));
      setFleet(updatedFleet);
    } catch (err) {
      setError('Failed to save fleet data');
      console.error('Fleet data save error:', err);
    }
  };

  // Add a new driver
  const addDriver = (driverData: Omit<Driver, 'id' | 'joinedDate'>) => {
    if (!fleet) return;

    const newDriver: Driver = {
      ...driverData,
      id: `driver-${Date.now()}`,
      joinedDate: new Date().toISOString()
    };

    const updatedFleet = {
      ...fleet,
      drivers: [...fleet.drivers, newDriver]
    };

    saveFleetData(updatedFleet);
  };

  // Remove a driver
  const removeDriver = (driverId: string) => {
    if (!fleet) return;

    const updatedFleet = {
      ...fleet,
      drivers: fleet.drivers.map(driver =>
        driver.id === driverId
          ? { ...driver, status: 'inactive' as const }
          : driver
      )
    };

    saveFleetData(updatedFleet);
  };

  // Update driver data
  const updateDriver = (driverId: string, updates: Partial<Driver>) => {
    if (!fleet) return;

    const updatedFleet = {
      ...fleet,
      drivers: fleet.drivers.map(driver =>
        driver.id === driverId
          ? { ...driver, ...updates }
          : driver
      )
    };

    saveFleetData(updatedFleet);
  };

  // Get a specific driver
  const getDriver = (driverId: string): Driver | undefined => {
    return fleet?.drivers.find(driver => driver.id === driverId);
  };

  // Calculate fleet analytics with caching
  const calculateAnalytics = (startDate?: string, endDate?: string): FleetAnalytics => {
    if (!fleet) {
      return {
        totalDistance: 0,
        totalTrips: 0,
        averageSafetyScore: 0,
        crashEventFrequency: 0,
        dateRange: {
          start: startDate || new Date().toISOString(),
          end: endDate || new Date().toISOString()
        }
      };
    }

    // Create cache key based on date range
    const cacheKey = `analytics_${startDate || 'all'}_${endDate || 'all'}`;
    
    // Try to get from cache first
    const cachedAnalytics = getCache<FleetAnalytics>(cacheKey, {
      namespace: 'fleet_analytics',
      ttl: ANALYTICS_CACHE_TTL
    });
    
    if (cachedAnalytics) {
      setAnalytics(cachedAnalytics);
      return cachedAnalytics;
    }

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    let totalDistance = 0;
    let totalTrips = 0;
    let totalSafetyScore = 0;
    let crashEvents = 0;

    fleet.drivers.forEach(driver => {
      if (driver.status !== 'active') return;

      const filteredTrips = driver.trips.filter(trip => {
        const tripDate = new Date(trip.date);
        return tripDate >= start && tripDate <= end;
      });

      totalDistance += filteredTrips.reduce((sum, trip) => sum + trip.distance, 0);
      totalTrips += filteredTrips.length;
      totalSafetyScore += driver.safetyScore;

      // Count crash events from localStorage
      try {
        const crashEventsData = localStorage.getItem('crash_events');
        if (crashEventsData) {
          const events = JSON.parse(crashEventsData);
          crashEvents += events.filter((event: any) => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= start && eventDate <= end;
          }).length;
        }
      } catch (err) {
        console.error('Failed to load crash events:', err);
      }
    });

    const activeDriverCount = fleet.drivers.filter(d => d.status === 'active').length;
    const averageSafetyScore = activeDriverCount > 0 ? totalSafetyScore / activeDriverCount : 0;
    const crashEventFrequency = totalTrips > 0 ? crashEvents / totalTrips : 0;

    const analyticsData: FleetAnalytics = {
      totalDistance,
      totalTrips,
      averageSafetyScore,
      crashEventFrequency,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };

    // Cache the analytics data
    setCache(cacheKey, analyticsData, {
      namespace: 'fleet_analytics',
      ttl: ANALYTICS_CACHE_TTL
    });

    setAnalytics(analyticsData);
    return analyticsData;
  };

  // Refresh fleet data
  const refreshFleet = () => {
    loadFleetData();
  };

  // Load fleet data on mount
  useEffect(() => {
    loadFleetData();
  }, []);

  const value: FleetContextValue = {
    fleet,
    analytics,
    isLoading,
    error,
    addDriver,
    removeDriver,
    updateDriver,
    getDriver,
    calculateAnalytics,
    refreshFleet
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (context === undefined) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
}
