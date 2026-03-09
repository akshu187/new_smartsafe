import { useState, useEffect, useCallback, useRef } from 'react';
import { useFleet } from '../contexts/FleetContext';
import type { Fleet, FleetAnalytics } from '../contexts/FleetContext';

interface UseFleetDataReturn {
  fleet: Fleet | null;
  analytics: FleetAnalytics | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  syncError: string | null;
  manualSync: () => Promise<void>;
}

const SYNC_INTERVAL_MS = 60000; // 60 seconds
const RETRY_DELAY_MS = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 5;

export function useFleetData(): UseFleetDataReturn {
  const { fleet, analytics, isLoading, error, refreshFleet, calculateAnalytics } = useFleet();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Perform data synchronization
  const performSync = useCallback(async () => {
    if (!isActiveRef.current || isSyncing) return;

    try {
      setIsSyncing(true);
      setSyncError(null);

      // Refresh fleet data from localStorage
      refreshFleet();

      // Recalculate analytics
      if (fleet) {
        calculateAnalytics();
      }

      // Update last sync time
      setLastSyncTime(new Date());
      setRetryCount(0);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Synchronization failed';
      setSyncError(errorMessage);
      console.error('Fleet data sync error:', err);

      // Schedule retry if under max attempts
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        setRetryCount(prev => prev + 1);
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        retryTimeoutRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            performSync();
          }
        }, RETRY_DELAY_MS);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [fleet, refreshFleet, calculateAnalytics, isSyncing, retryCount]);

  // Manual sync function
  const manualSync = useCallback(async () => {
    setRetryCount(0); // Reset retry count on manual sync
    await performSync();
  }, [performSync]);

  // Set up automatic synchronization
  useEffect(() => {
    isActiveRef.current = true;

    // Perform initial sync
    performSync();

    // Set up periodic sync
    syncIntervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        performSync();
      }
    }, SYNC_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      isActiveRef.current = false;
      
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [performSync]);

  return {
    fleet,
    analytics,
    isLoading,
    isSyncing,
    error,
    lastSyncTime,
    syncError,
    manualSync
  };
}
