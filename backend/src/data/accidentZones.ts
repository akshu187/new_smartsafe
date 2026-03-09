export interface AccidentZoneRecord {
  id: string;
  city: string;
  latitude: number;
  longitude: number;
  severity: 'low' | 'medium' | 'high';
  accidentCount: number;
  description: string;
  radius: number;
}

export const accidentZones: AccidentZoneRecord[] = [
  {
    id: 'roorkee-nh58-haridwar',
    city: 'Roorkee',
    latitude: 29.86,
    longitude: 77.9,
    severity: 'high',
    accidentCount: 45,
    description: 'NH-58 Haridwar stretch - heavy truck traffic and overtaking collisions',
    radius: 1500,
  },
  {
    id: 'roorkee-market',
    city: 'Roorkee',
    latitude: 29.8545,
    longitude: 77.8905,
    severity: 'medium',
    accidentCount: 28,
    description: 'Main market area with dense pedestrian and two-wheeler traffic',
    radius: 800,
  },
  {
    id: 'delhi-gt-karnal',
    city: 'Delhi',
    latitude: 28.743,
    longitude: 77.152,
    severity: 'high',
    accidentCount: 95,
    description: 'GT Karnal Road high-speed commercial corridor',
    radius: 1800,
  },
  {
    id: 'delhi-aiims-ring-road',
    city: 'Delhi',
    latitude: 28.567,
    longitude: 77.21,
    severity: 'high',
    accidentCount: 64,
    description: 'AIIMS Ring Road intersection with multi-direction conflict traffic',
    radius: 1200,
  },
  {
    id: 'mumbai-weh-andheri',
    city: 'Mumbai',
    latitude: 19.119,
    longitude: 72.846,
    severity: 'high',
    accidentCount: 78,
    description: 'Western Express Highway segment with frequent lane conflicts',
    radius: 1500,
  },
  {
    id: 'mumbai-sion-junction',
    city: 'Mumbai',
    latitude: 19.042,
    longitude: 72.865,
    severity: 'medium',
    accidentCount: 42,
    description: 'Sion junction congestion and merge-point incidents',
    radius: 1000,
  },
  {
    id: 'bangalore-outer-ring-road',
    city: 'Bengaluru',
    latitude: 12.933,
    longitude: 77.696,
    severity: 'high',
    accidentCount: 58,
    description: 'Outer Ring Road night-time speed and visibility incidents',
    radius: 1400,
  },
  {
    id: 'bangalore-hosur-road',
    city: 'Bengaluru',
    latitude: 12.91,
    longitude: 77.613,
    severity: 'medium',
    accidentCount: 35,
    description: 'Hosur Road corridor with dense two-wheeler traffic',
    radius: 1200,
  },
];

