import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
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

interface TileProvider {
  name: string;
  url: string;
  subdomains?: string[];
}

const TILE_PROVIDERS: TileProvider[] = [
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
  },
  {
    name: 'OSM France HOT',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
  },
  {
    name: 'Carto Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
  },
  {
    name: 'Esri Streets',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  },
  {
    name: 'Wikimedia',
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
  },
];

const TILE_LOAD_TIMEOUT_MS = 6000;

export function useMap(options: UseMapOptions = {}): UseMapReturn {
  const { initialCenter = [0, 0], initialZoom = 13, onError } = options;

  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const providerIndexRef = useRef(0);
  const providerTimeoutRef = useRef<number | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapState, setMapState] = useState<MapState>({
    center: initialCenter,
    zoom: initialZoom,
    cachedTiles: [],
    lastUpdate: new Date(),
  });

  const { isOnline } = useNetworkStatus();

  const clearProviderTimeout = () => {
    if (providerTimeoutRef.current !== null) {
      window.clearTimeout(providerTimeoutRef.current);
      providerTimeoutRef.current = null;
    }
  };

  const removeCurrentLayer = (map: L.Map) => {
    clearProviderTimeout();
    if (!tileLayerRef.current) {
      return;
    }
    tileLayerRef.current.off();
    if (map.hasLayer(tileLayerRef.current)) {
      map.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = null;
  };

  const createTileLayer = (providerIndex: number): L.TileLayer => {
    const provider = TILE_PROVIDERS[providerIndex] || TILE_PROVIDERS[0];
    return L.tileLayer(provider.url, {
      subdomains: provider.subdomains,
      maxZoom: 19,
      attribution: '(c) OpenStreetMap',
      crossOrigin: true,
      keepBuffer: 2,
    });
  };

  const attachLayer = (map: L.Map, providerIndex: number) => {
    removeCurrentLayer(map);

    const provider = TILE_PROVIDERS[providerIndex];
    const layer = createTileLayer(providerIndex);
    let hasLoadedAnyTile = false;
    let tileErrors = 0;

    const switchProvider = (reason: string) => {
      const nextProvider = providerIndexRef.current + 1;
      if (nextProvider < TILE_PROVIDERS.length) {
        providerIndexRef.current = nextProvider;
        const nextName = TILE_PROVIDERS[nextProvider].name;
        console.warn(`[Map] ${provider.name} failed (${reason}). Switching to ${nextName}.`);
        attachLayer(map, providerIndexRef.current);
        return;
      }

      const message = 'Unable to load map tiles. Check internet/DNS or firewall restrictions.';
      console.error(`[Map] All providers failed. Last reason: ${reason}.`);
      setError(message);
      if (onError) {
        onError(message);
      }
    };

    layer.on('tileload', () => {
      hasLoadedAnyTile = true;
      tileErrors = 0;
      clearProviderTimeout();
      setError(null);
    });

    layer.on('tileerror', (event) => {
      tileErrors += 1;

      if (hasLoadedAnyTile) {
        return;
      }

      if (tileErrors < 3) {
        return;
      }

      const tileSource = (event as { tile?: { src?: string } })?.tile?.src ?? 'unknown';
      switchProvider(`tileerror x${tileErrors} (${tileSource})`);
    });

    layer.addTo(map);
    console.info(`[Map] Using tile provider: ${provider.name}`);
    tileLayerRef.current = layer;
    providerTimeoutRef.current = window.setTimeout(() => {
      if (!hasLoadedAnyTile) {
        switchProvider(`timeout after ${TILE_LOAD_TIMEOUT_MS}ms`);
      }
    }, TILE_LOAD_TIMEOUT_MS);
  };

  const initializeMap = (container: HTMLElement) => {
    try {
      if (mapRef.current) {
        removeCurrentLayer(mapRef.current);
        mapRef.current.remove();
      }

      providerIndexRef.current = 0;

      const map = L.map(container, {
        center: mapState.center,
        zoom: mapState.zoom,
        zoomControl: true,
        attributionControl: false,
      });

      attachLayer(map, providerIndexRef.current);

      map.on('moveend', () => {
        const center = map.getCenter();
        setMapState((prev) => ({
          ...prev,
          center: [center.lat, center.lng],
          lastUpdate: new Date(),
        }));
      });

      map.on('zoomend', () => {
        setMapState((prev) => ({
          ...prev,
          zoom: map.getZoom(),
          lastUpdate: new Date(),
        }));
      });

      map.whenReady(() => {
        map.invalidateSize(true);
        setTimeout(() => map.invalidateSize(true), 250);
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
      setMapState((prev) => ({
        ...prev,
        center,
        lastUpdate: new Date(),
      }));
    }
  };

  const updateZoom = (zoom: number) => {
    if (mapRef.current) {
      mapRef.current.setZoom(zoom);
      setMapState((prev) => ({
        ...prev,
        zoom,
        lastUpdate: new Date(),
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        removeCurrentLayer(mapRef.current);
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
    initializeMap,
  };
}
