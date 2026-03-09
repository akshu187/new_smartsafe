import { useState, useEffect } from 'react';
import { getCacheOrFetch } from '../utils/cache';

interface ReverseGeocodeResult {
  address: string;
  city: string;
  state: string;
  country: string;
  displayName: string;
}

interface UseReverseGeocodeOptions {
  location?: { latitude: number; longitude: number } | null;
  enabled?: boolean;
}

interface UseReverseGeocodeReturn {
  address: ReverseGeocodeResult | null;
  isLoading: boolean;
  error: string | null;
}

const CACHE_NAMESPACE = 'reverse_geocode';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to get address from GPS coordinates using reverse geocoding
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export function useReverseGeocode(options: UseReverseGeocodeOptions = {}): UseReverseGeocodeReturn {
  const { location, enabled = true } = options;
  
  const [address, setAddress] = useState<ReverseGeocodeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location || !enabled) {
      setAddress(null);
      return;
    }

    const fetchAddress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { latitude, longitude } = location;
        
        // Round coordinates for caching (0.001 degree precision ≈ 100m)
        const roundedLat = Math.round(latitude * 1000) / 1000;
        const roundedLon = Math.round(longitude * 1000) / 1000;
        const cacheKey = `address_${roundedLat}_${roundedLon}`;

        // Use cache-or-fetch pattern
        const result = await getCacheOrFetch<ReverseGeocodeResult>(
          cacheKey,
          async () => {
            console.log('Reverse geocode: Fetching from API');
            
            // OpenStreetMap Nominatim API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'SmartSafe-RoadSafety-App'
                }
              }
            );

            if (!response.ok) {
              throw new Error('Reverse geocoding failed');
            }

            const data = await response.json();
            
            // Extract address components
            const addr = data.address || {};
            
            return {
              address: data.display_name || 'Unknown location',
              city: addr.city || addr.town || addr.village || addr.county || 'Unknown',
              state: addr.state || 'Unknown',
              country: addr.country || 'Unknown',
              displayName: formatDisplayName(addr)
            };
          },
          {
            namespace: CACHE_NAMESPACE,
            ttl: CACHE_TTL
          }
        );

        setAddress(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get address';
        setError(errorMessage);
        console.error('Reverse geocode error:', err);
        
        // Fallback to coordinates display
        setAddress({
          address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
          city: 'Unknown',
          state: 'Unknown',
          country: 'Unknown',
          displayName: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddress();
  }, [location?.latitude, location?.longitude, enabled]);

  return {
    address,
    isLoading,
    error
  };
}

/**
 * Format address for display
 */
function formatDisplayName(addr: any): string {
  const parts: string[] = [];
  
  // Add road/street
  if (addr.road) parts.push(addr.road);
  
  // Add locality
  if (addr.suburb || addr.neighbourhood) {
    parts.push(addr.suburb || addr.neighbourhood);
  }
  
  // Add city
  if (addr.city || addr.town || addr.village) {
    parts.push(addr.city || addr.town || addr.village);
  }
  
  // Add state
  if (addr.state) parts.push(addr.state);
  
  return parts.join(', ') || 'Unknown location';
}
