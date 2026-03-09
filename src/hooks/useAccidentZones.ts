import { useEffect, useState } from 'react';
import type { AccidentZone } from '../types/map';
import axiosInstance from '../services/axiosInstance';
import { API_ENDPOINTS } from '../config/api';
import { getCache, setCache } from '../utils/cache';

interface UseAccidentZonesOptions {
  location?: { latitude: number; longitude: number } | null;
  radius?: number;
  enabled?: boolean;
}

interface UseAccidentZonesReturn {
  zones: AccidentZone[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CACHE_NAMESPACE = 'accident_zones';
const CACHE_TTL = 5 * 60 * 1000;

interface AccidentZonesApiResponse {
  success: boolean;
  data: {
    zones: AccidentZone[];
  };
}

export function useAccidentZones(options: UseAccidentZonesOptions = {}): UseAccidentZonesReturn {
  const { location, radius = 50, enabled = true } = options;

  const [zones, setZones] = useState<AccidentZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = async () => {
    if (!location || !enabled) {
      setZones([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const roundedLat = Math.round(location.latitude * 100) / 100;
    const roundedLon = Math.round(location.longitude * 100) / 100;
    const cacheKey = `zones_${roundedLat}_${roundedLon}_${radius}`;

    try {
      const cachedZones = getCache<AccidentZone[]>(cacheKey, {
        namespace: CACHE_NAMESPACE,
        ttl: CACHE_TTL,
      });

      if (cachedZones) {
        setZones(cachedZones);
        setIsLoading(false);
        return;
      }

      const response = await axiosInstance.get<AccidentZonesApiResponse>(
        API_ENDPOINTS.accidentZones.nearby,
        {
          params: {
            lat: location.latitude,
            lon: location.longitude,
            radius,
          },
        }
      );

      const apiZones = response.data.data.zones || [];
      setZones(apiZones);

      setCache(cacheKey, apiZones, {
        namespace: CACHE_NAMESPACE,
        ttl: CACHE_TTL,
      });
    } catch (err) {
      console.error('Accident zones fetch error:', err);
      setZones([]);
      setError('Unable to fetch live accident zones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchZones();

    const refreshInterval = setInterval(() => {
      void fetchZones();
    }, CACHE_TTL);

    return () => clearInterval(refreshInterval);
  }, [location?.latitude, location?.longitude, radius, enabled]);

  return {
    zones,
    isLoading,
    error,
    refetch: fetchZones,
  };
}
