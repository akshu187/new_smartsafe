import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { getCachedTile, cacheTile, isTileCached } from '../utils/mapCache';
import { useNetworkStatus } from './useNetworkStatus';

export interface MapState {
  center: [number, number];
  zoom: number;
  cachedTiles: string[];
  lastUpdate: Date;
}

export interface UseMapOptions {
  initialCenter?: [number, number];
  initialZoom?: number;
  onError?: (error: string) => void;
}

export interface UseMapReturn {
  mapRef: { current: L.Map | null };
  mapState: MapState;
  isInitialized: boolean;
  error: string | null;
  isOffline: boolean;
  updateCenter: (center: [number, number]) => void;
  updateZoom: (zoom: number) => void;
  initializeMap: (container: HTMLElement) => void;
}

export function useMap(options: UseMapOptions = {}): UseMapReturn {
  const {
    initialCenter = [0, 0],
    initialZoom = 13,
    onError
  } = options;

  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapState, setMapState] = useState<MapState>({
    center: initialCenter,
    zoom: initialZoom,
    cachedTiles: [],
    lastUpdate: new Date()
  });

  const { isOnline } = useNetworkStatus();

  // Custom tile loading function that uses cache when offline
  const createTileLayer = () => {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
      // Override tile loading to use cache
      crossOrigin: true,
    });
  };

  const initializeMap = (container: HTMLElement) => {
    try {
      if (mapRef.current) {
        mapRef.current.remove();
      }

      const map = L.map(container, {
        center: mapState.center,
        zoom: mapState.zoom,
        zoomControl: true,
        attributionControl: false
      });

      // Create tile layer with caching support
      const tileLayer = createTileLayer();
      
      // Intercept tile loading to use cache
      const originalCreateTile = (tileLayer as any).createTile;
      (tileLayer as any).createTile = function(coords: any, done: any) {
        const tile = originalCreateTile.call(this, coords, done);
        const url = (tileLayer as any).getTileUrl(coords);
        
        if (!isOnline) {
          // Try to load from cache when offline
          const cachedData = getCachedTile(url);
          if (cachedData) {
            tile.src = cachedData;
          } else {
            // Show placeholder for uncached tiles
            tile.style.opacity = '0.3';
            tile.alt = 'Tile not available offline';
          }
        } else {
          // When online, cache tiles as they load
          tile.addEventListener('load', () => {
            cacheTile(url).catch(err => {
              console.warn('Failed to cache tile:', err);
            });
          });
        }
        
        return tile;
      };

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;

      // Listen to map events
      map.on('moveend', () => {
        const center = map.getCenter();
        setMapState((prev: MapState) => ({
          ...prev,
          center: [center.lat, center.lng],
          lastUpdate: new Date()
        }));
      });

      map.on('zoomend', () => {
        setMapState((prev: MapState) => ({
          ...prev,
          zoom: map.getZoom(),
          lastUpdate: new Date()
        }));
      });

      mapRef.current = map;
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize map';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const updateCenter = (center: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom());
      setMapState((prev: MapState) => ({
        ...prev,
        center,
        lastUpdate: new Date()
      }));
    }
  };

  const updateZoom = (zoom: number) => {
    if (mapRef.current) {
      mapRef.current.setZoom(zoom);
      setMapState((prev: MapState) => ({
        ...prev,
        zoom,
        lastUpdate: new Date()
      }));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return {
    mapRef,
    mapState,
    isInitialized,
    error,
    isOffline: !isOnline,
    updateCenter,
    updateZoom,
    initializeMap
  };
}
