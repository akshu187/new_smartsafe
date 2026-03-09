import { env } from '../config/env';

const EARTH_RADIUS_KM = 6371;

export type ZoneSeverity = 'low' | 'medium' | 'high';

export interface LiveIncidentZone {
  id: string;
  latitude: number;
  longitude: number;
  severity: ZoneSeverity;
  accidentCount: number;
  description: string;
  radius: number;
  source: 'live_incident';
  provider: string;
  confidence: number;
  reportedAt?: string;
}

export interface LiveIncidentFetchResult {
  zones: LiveIncidentZone[];
  provider: string;
  enabled: boolean;
  fallbackReason?: string;
}

interface CacheEntry {
  expiresAt: number;
  zones: LiveIncidentZone[];
}

const requestCache = new Map<string, CacheEntry>();

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const normalizeSeverity = (value: unknown): ZoneSeverity => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric >= 9) {
      return 'high';
    }
    if (numeric >= 5) {
      return 'medium';
    }
    return 'low';
  }

  const text = String(value || '').toLowerCase();
  if (text.includes('high') || text.includes('major') || text.includes('critical')) {
    return 'high';
  }
  if (text.includes('medium') || text.includes('moderate')) {
    return 'medium';
  }
  return 'low';
};

const severityToRadius = (severity: ZoneSeverity): number => {
  if (severity === 'high') {
    return 1200;
  }
  if (severity === 'medium') {
    return 900;
  }
  return 650;
};

const severityToConfidence = (severity: ZoneSeverity): number => {
  if (severity === 'high') {
    return 92;
  }
  if (severity === 'medium') {
    return 82;
  }
  return 72;
};

const extractIncidents = (payload: any): any[] => {
  if (Array.isArray(payload?.incidents)) {
    return payload.incidents;
  }

  if (Array.isArray(payload?.incidents?.incident)) {
    return payload.incidents.incident;
  }

  if (Array.isArray(payload?.tm?.poi)) {
    return payload.tm.poi;
  }

  return [];
};

const extractCoordinates = (incident: any): [number, number] | null => {
  const geometryCoordinates = incident?.geometry?.coordinates;
  if (
    Array.isArray(geometryCoordinates) &&
    Array.isArray(geometryCoordinates[0]) &&
    geometryCoordinates[0].length >= 2
  ) {
    const [lon, lat] = geometryCoordinates[0];
    return [Number(lat), Number(lon)];
  }

  if (Array.isArray(geometryCoordinates) && geometryCoordinates.length >= 2) {
    const [lon, lat] = geometryCoordinates;
    return [Number(lat), Number(lon)];
  }

  const point = incident?.p;
  if (point && Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y))) {
    return [Number(point.y), Number(point.x)];
  }

  return null;
};

const toTomTomZones = (
  incidents: any[],
  centerLat: number,
  centerLon: number,
  radiusKm: number
): LiveIncidentZone[] => {
  return incidents
    .map((incident: any, index: number): LiveIncidentZone | null => {
      const coordinates = extractCoordinates(incident);
      if (!coordinates) {
        return null;
      }

      const [lat, lon] = coordinates;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
      }

      const distanceKm = haversineDistanceKm(centerLat, centerLon, lat, lon);
      if (distanceKm > radiusKm) {
        return null;
      }

      const rawSeverity =
        incident?.properties?.iconCategory ??
        incident?.properties?.magnitudeOfDelay ??
        incident?.ty ??
        incident?.severity;
      const severity = normalizeSeverity(rawSeverity);
      const description =
        incident?.properties?.events?.[0]?.description ||
        incident?.properties?.description ||
        incident?.d ||
        'Live traffic incident detected near this route';
      const incidentId =
        incident?.properties?.id ||
        incident?.id ||
        incident?.idDisplay ||
        `live-${index}-${Math.round(lat * 10000)}-${Math.round(lon * 10000)}`;

      return {
        id: `live-${incidentId}`,
        latitude: lat,
        longitude: lon,
        severity,
        accidentCount: severity === 'high' ? 5 : severity === 'medium' ? 3 : 1,
        description,
        radius: severityToRadius(severity),
        source: 'live_incident',
        provider: 'tomtom',
        confidence: severityToConfidence(severity),
        reportedAt: incident?.properties?.startTime || incident?.startTime,
      };
    })
    .filter((zone): zone is LiveIncidentZone => zone !== null);
};

const buildBbox = (latitude: number, longitude: number, radiusKm: number): string => {
  const deltaLat = radiusKm / 111;
  const deltaLon = radiusKm / (111 * Math.max(Math.cos(toRadians(latitude)), 0.2));

  const minLat = latitude - deltaLat;
  const maxLat = latitude + deltaLat;
  const minLon = longitude - deltaLon;
  const maxLon = longitude + deltaLon;

  return `${minLon},${minLat},${maxLon},${maxLat}`;
};

const getCacheKey = (latitude: number, longitude: number, radiusKm: number): string => {
  const lat = Math.round(latitude * 100) / 100;
  const lon = Math.round(longitude * 100) / 100;
  const radius = Math.round(radiusKm * 10) / 10;
  return `live:${lat}:${lon}:${radius}`;
};

const getCached = (cacheKey: string): LiveIncidentZone[] | null => {
  const cached = requestCache.get(cacheKey);
  if (!cached) {
    return null;
  }
  if (Date.now() >= cached.expiresAt) {
    requestCache.delete(cacheKey);
    return null;
  }
  return cached.zones;
};

const setCached = (cacheKey: string, zones: LiveIncidentZone[]) => {
  requestCache.set(cacheKey, {
    zones,
    expiresAt: Date.now() + env.liveIncidentCacheTtlSec * 1000,
  });
};

const fetchTomTomIncidents = async (
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<LiveIncidentZone[]> => {
  if (!env.tomtomApiKey) {
    return [];
  }

  const bbox = buildBbox(latitude, longitude, radiusKm);
  const url = new URL('https://api.tomtom.com/traffic/services/5/incidentDetails');
  url.searchParams.set('key', env.tomtomApiKey);
  url.searchParams.set('bbox', bbox);
  url.searchParams.set('language', 'en-GB');
  url.searchParams.set('timeValidityFilter', 'present');
  url.searchParams.set(
    'fields',
    '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description},startTime}}}'
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.liveIncidentRequestTimeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TomTom API returned ${response.status}`);
    }

    const payload = await response.json();
    const incidents = extractIncidents(payload);
    return toTomTomZones(incidents, latitude, longitude, radiusKm);
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchLiveIncidentZones = async (
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<LiveIncidentFetchResult> => {
  if (!env.enableLiveIncidentFetch) {
    return {
      zones: [],
      provider: env.liveIncidentProvider,
      enabled: false,
      fallbackReason: 'Live incident integration is disabled by configuration',
    };
  }

  const boundedRadiusKm = Math.min(radiusKm, env.liveIncidentMaxRadiusKm);
  const cacheKey = getCacheKey(latitude, longitude, boundedRadiusKm);
  const cached = getCached(cacheKey);
  if (cached) {
    return {
      zones: cached,
      provider: env.liveIncidentProvider,
      enabled: true,
    };
  }

  try {
    let zones: LiveIncidentZone[] = [];
    if (env.liveIncidentProvider === 'tomtom') {
      zones = await fetchTomTomIncidents(latitude, longitude, boundedRadiusKm);
    }

    setCached(cacheKey, zones);
    return {
      zones,
      provider: env.liveIncidentProvider,
      enabled: true,
    };
  } catch (error) {
    return {
      zones: [],
      provider: env.liveIncidentProvider,
      enabled: true,
      fallbackReason:
        error instanceof Error ? error.message : 'Live provider request failed',
    };
  }
};
