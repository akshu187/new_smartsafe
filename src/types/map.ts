export interface AccidentZone {
  id: string;
  coordinates: [number, number][]; // Polygon coordinates
  severity: 'low' | 'medium' | 'high';
  accidentCount: number;
  description: string;
  radius: number; // in meters
  city?: string;
  distanceKm?: number;
  source?: 'historical_blackspot' | 'live_incident';
  provider?: string;
  confidence?: number;
  reportedAt?: string;
}

export interface POI {
  id: string;
  name: string;
  category: 'hospital' | 'police' | 'gas_station' | 'rest_area' | 'mechanic';
  coordinates: [number, number];
  description?: string;
  phone?: string;
}
