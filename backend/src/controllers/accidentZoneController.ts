import { Request, Response } from 'express';
import { accidentZones } from '../data/accidentZones';
import { asyncHandler } from '../utils/errorHandler';
import { successResponse } from '../utils/response';
import { fetchLiveIncidentZones } from '../services/liveIncidentService';

const EARTH_RADIUS_KM = 6371;

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

const buildSquarePolygon = (
  latitude: number,
  longitude: number,
  radiusMeters: number
): [number, number][] => {
  const deltaLat = radiusMeters / 111000;
  const deltaLon = radiusMeters / (111000 * Math.cos(toRadians(latitude)));

  return [
    [latitude + deltaLat, longitude + deltaLon],
    [latitude + deltaLat, longitude - deltaLon],
    [latitude - deltaLat, longitude - deltaLon],
    [latitude - deltaLat, longitude + deltaLon],
  ];
};

type ZoneSeverity = 'low' | 'medium' | 'high';

interface ZoneResponse {
  id: string;
  severity: ZoneSeverity;
  accidentCount: number;
  description: string;
  radius: number;
  coordinates: [number, number][];
  city: string;
  distanceKm: number;
  center: [number, number];
  source: 'historical_blackspot' | 'live_incident';
  provider: 'internal' | string;
  confidence: number;
  reportedAt?: string;
}

const severityToHistoricalConfidence = (severity: ZoneSeverity): number => {
  if (severity === 'high') {
    return 80;
  }
  if (severity === 'medium') {
    return 70;
  }
  return 62;
};

const shouldMergeZones = (a: ZoneResponse, b: ZoneResponse): boolean => {
  const centerA = a.center;
  const centerB = b.center;
  const distanceKm = haversineDistanceKm(centerA[0], centerA[1], centerB[0], centerB[1]);
  return distanceKm <= 0.35;
};

const mergeZones = (zones: ZoneResponse[]): ZoneResponse[] => {
  const merged: ZoneResponse[] = [];

  zones.forEach((zone) => {
    const existingIndex = merged.findIndex((existing) => shouldMergeZones(existing, zone));
    if (existingIndex === -1) {
      merged.push(zone);
      return;
    }

    const existing = merged[existingIndex];
    const keepIncoming =
      (zone.source === 'live_incident' && existing.source !== 'live_incident') ||
      zone.confidence > existing.confidence;

    if (keepIncoming) {
      merged[existingIndex] = zone;
    }
  });

  return merged;
};

/**
 * @desc    Get accident zones near a location
 * @route   GET /api/accident-zones
 * @access  Public
 */
export const getAccidentZonesNearLocation = asyncHandler(
  async (req: Request, res: Response) => {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);
    const radiusKm = Number(req.query.radius || 50);
    const includeLive = String(req.query.includeLive || 'true').toLowerCase() !== 'false';

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Provide valid lat and lon query params.',
      });
      return;
    }

    const staticZones: ZoneResponse[] = accidentZones
      .map((zone) => ({
        ...zone,
        distanceKm: haversineDistanceKm(
          latitude,
          longitude,
          zone.latitude,
          zone.longitude
        ),
      }))
      .filter((zone) => zone.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map((zone) => ({
        id: zone.id,
        severity: zone.severity,
        accidentCount: zone.accidentCount,
        description: zone.description,
        radius: zone.radius,
        coordinates: buildSquarePolygon(zone.latitude, zone.longitude, zone.radius),
        city: zone.city,
        distanceKm: Number(zone.distanceKm.toFixed(2)),
        center: [zone.latitude, zone.longitude],
        source: 'historical_blackspot',
        provider: 'internal',
        confidence: severityToHistoricalConfidence(zone.severity),
      }));

    const liveResult = includeLive
      ? await fetchLiveIncidentZones(latitude, longitude, radiusKm)
      : {
          zones: [],
          provider: 'disabled',
          enabled: false,
          fallbackReason: 'Live incident fetch not requested',
        };

    const liveZones: ZoneResponse[] = liveResult.zones.map((zone) => ({
      id: zone.id,
      severity: zone.severity,
      accidentCount: zone.accidentCount,
      description: zone.description,
      radius: zone.radius,
      coordinates: buildSquarePolygon(zone.latitude, zone.longitude, zone.radius),
      city: 'Live Traffic Incident',
      distanceKm: Number(
        haversineDistanceKm(latitude, longitude, zone.latitude, zone.longitude).toFixed(2)
      ),
      center: [zone.latitude, zone.longitude],
      source: 'live_incident',
      provider: zone.provider,
      confidence: zone.confidence,
      reportedAt: zone.reportedAt,
    }));

    const zones = mergeZones([...liveZones, ...staticZones])
      .map(({ center, ...zone }) => zone)
      .sort(
      (a, b) => a.distanceKm - b.distanceKm
    );

    successResponse(
      res,
      {
        zones,
        meta: {
          includeLive,
          liveEnabled: liveResult.enabled,
          liveProvider: liveResult.provider,
          liveZoneCount: liveZones.length,
          staticZoneCount: staticZones.length,
          mergedZoneCount: zones.length,
          fallbackReason: liveResult.fallbackReason || null,
          generatedAt: new Date().toISOString(),
        },
      },
      'Accident zones retrieved successfully'
    );
  }
);
