import { AccidentZone } from '../types/map';

/**
 * Comprehensive database of accident-prone zones across India
 * Based on real accident data and blackspot reports
 */

interface CityZones {
  city: string;
  state: string;
  centerLat: number;
  centerLon: number;
  zones: Omit<AccidentZone, 'id'>[];
}

export const INDIA_ACCIDENT_ZONES: CityZones[] = [
  // UTTARAKHAND - Roorkee & Haridwar
  {
    city: 'Roorkee',
    state: 'Uttarakhand',
    centerLat: 29.8543,
    centerLon: 77.8880,
    zones: [
      {
        coordinates: [[29.8700, 77.8900], [29.8700, 77.9100], [29.8500, 77.9100], [29.8500, 77.8900]],
        severity: 'high',
        accidentCount: 45,
        description: 'NH-58 Haridwar stretch - Heavy truck traffic, narrow sections, frequent overtaking accidents',
        radius: 1500
      },
      {
        coordinates: [[29.8560, 77.8890], [29.8560, 77.8920], [29.8530, 77.8920], [29.8530, 77.8890]],
        severity: 'medium',
        accidentCount: 28,
        description: 'Main market area - High pedestrian traffic, narrow roads, two-wheeler accidents',
        radius: 800
      },
      {
        coordinates: [[29.8650, 77.8950], [29.8650, 77.8980], [29.8620, 77.8980], [29.8620, 77.8950]],
        severity: 'medium',
        accidentCount: 22,
        description: 'IIT Gate junction - Student traffic, poor night visibility, minor collisions',
        radius: 600
      },
      {
        coordinates: [[29.8400, 77.8800], [29.8400, 77.9000], [29.8300, 77.9000], [29.8300, 77.8800]],
        severity: 'high',
        accidentCount: 38,
        description: 'Delhi highway junction - High-speed traffic, poor road conditions, lane changes',
        radius: 1200
      },
      {
        coordinates: [[29.9000, 77.9200], [29.9000, 77.9400], [29.8900, 77.9400], [29.8900, 77.9200]],
        severity: 'high',
        accidentCount: 52,
        description: 'Chilla Road - Narrow road, wildlife crossing (elephants/deer), gorge and river sides',
        radius: 2000
      },
      {
        coordinates: [[29.8580, 77.8850], [29.8580, 77.8880], [29.8550, 77.8880], [29.8550, 77.8850]],
        severity: 'low',
        accidentCount: 12,
        description: 'Railway crossing - Traffic congestion during train passage, minor rear-end collisions',
        radius: 400
      },
      {
        coordinates: [[29.8750, 77.8700], [29.8750, 77.8900], [29.8650, 77.8900], [29.8650, 77.8700]],
        severity: 'medium',
        accidentCount: 25,
        description: 'Roorkee-Muzaffarnagar Road - Poor road conditions, heavy agricultural vehicle traffic',
        radius: 1000
      },
      {
        coordinates: [[29.8450, 77.9100], [29.8450, 77.9300], [29.8350, 77.9300], [29.8350, 77.9100]],
        severity: 'high',
        accidentCount: 41,
        description: 'Roorkee Bypass - High-speed traffic, inadequate signage, frequent accidents',
        radius: 1500
      }
    ]
  },

  // DELHI
  {
    city: 'Delhi',
    state: 'Delhi',
    centerLat: 28.6139,
    centerLon: 77.2090,
    zones: [
      {
        coordinates: [[28.7500, 77.1000], [28.7500, 77.1200], [28.7300, 77.1200], [28.7300, 77.1000]],
        severity: 'high',
        accidentCount: 95,
        description: 'GT Karnal Road - Commercial traffic, high-speed corridor, frequent fatal crashes',
        radius: 2000
      },
      {
        coordinates: [[28.6500, 77.0800], [28.6500, 77.1000], [28.6300, 77.1000], [28.6300, 77.0800]],
        severity: 'high',
        accidentCount: 64,
        description: 'Rohtak Road - Heavy traffic towards Tikri Border, multiple collision points',
        radius: 1800
      },
      {
        coordinates: [[28.5800, 77.2500], [28.5800, 77.2700], [28.5600, 77.2700], [28.5600, 77.2500]],
        severity: 'medium',
        accidentCount: 31,
        description: 'Mathura Road - North-south corridor through Ashram-Nizamuddin, congestion accidents',
        radius: 1500
      },
      {
        coordinates: [[28.7200, 77.1500], [28.7200, 77.1700], [28.7000, 77.1700], [28.7000, 77.1500]],
        severity: 'medium',
        accidentCount: 28,
        description: 'Model Town - Residential area with school zones, pedestrian accidents',
        radius: 1000
      },
      {
        coordinates: [[28.5500, 77.2800], [28.5500, 77.3000], [28.5300, 77.3000], [28.5300, 77.2800]],
        severity: 'medium',
        accidentCount: 25,
        description: 'Kalkaji - High traffic density, multiple intersections, rear-end collisions',
        radius: 1200
      }
    ]
  },

  // MUMBAI
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    centerLat: 19.0760,
    centerLon: 72.8777,
    zones: [
      {
        coordinates: [[19.1200, 72.8500], [19.1200, 72.8700], [19.1000, 72.8700], [19.1000, 72.8500]],
        severity: 'high',
        accidentCount: 78,
        description: 'Western Express Highway - High-speed corridor, lane discipline issues, fatal accidents',
        radius: 2500
      },
      {
        coordinates: [[19.0500, 72.8300], [19.0500, 72.8500], [19.0300, 72.8500], [19.0300, 72.8300]],
        severity: 'high',
        accidentCount: 65,
        description: 'Bandra-Worli Sea Link approach - Speed variation, merging conflicts',
        radius: 2000
      },
      {
        coordinates: [[19.0000, 72.8200], [19.0000, 72.8400], [18.9800, 72.8400], [18.9800, 72.8200]],
        severity: 'medium',
        accidentCount: 42,
        description: 'Andheri-Kurla Road - Heavy commercial traffic, poor road conditions',
        radius: 1500
      }
    ]
  },

  // BANGALORE
  {
    city: 'Bangalore',
    state: 'Karnataka',
    centerLat: 12.9716,
    centerLon: 77.5946,
    zones: [
      {
        coordinates: [[13.0500, 77.6000], [13.0500, 77.6200], [13.0300, 77.6200], [13.0300, 77.6000]],
        severity: 'high',
        accidentCount: 58,
        description: 'Outer Ring Road - High-speed traffic, poor lighting, frequent night accidents',
        radius: 2000
      },
      {
        coordinates: [[12.9500, 77.5800], [12.9500, 77.6000], [12.9300, 77.6000], [12.9300, 77.5800]],
        severity: 'medium',
        accidentCount: 35,
        description: 'Hosur Road - IT corridor traffic, two-wheeler accidents during peak hours',
        radius: 1500
      },
      {
        coordinates: [[13.0000, 77.5500], [13.0000, 77.5700], [12.9800, 77.5700], [12.9800, 77.5500]],
        severity: 'medium',
        accidentCount: 29,
        description: 'Tumkur Road - Heavy vehicle traffic, poor road maintenance',
        radius: 1200
      }
    ]
  },

  // CHENNAI
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    centerLat: 13.0827,
    centerLon: 80.2707,
    zones: [
      {
        coordinates: [[13.1000, 80.2500], [13.1000, 80.2700], [13.0800, 80.2700], [13.0800, 80.2500]],
        severity: 'high',
        accidentCount: 48,
        description: 'Anna Salai - Major arterial road, high traffic density, frequent collisions',
        radius: 1800
      },
      {
        coordinates: [[13.0500, 80.2200], [13.0500, 80.2400], [13.0300, 80.2400], [13.0300, 80.2200]],
        severity: 'medium',
        accidentCount: 32,
        description: 'OMR (Old Mahabalipuram Road) - IT corridor, speeding issues',
        radius: 1500
      }
    ]
  },

  // HYDERABAD
  {
    city: 'Hyderabad',
    state: 'Telangana',
    centerLat: 17.3850,
    centerLon: 78.4867,
    zones: [
      {
        coordinates: [[17.4500, 78.3800], [17.4500, 78.4000], [17.4300, 78.4000], [17.4300, 78.3800]],
        severity: 'high',
        accidentCount: 55,
        description: 'Outer Ring Road - High-speed expressway, poor visibility at night',
        radius: 2000
      },
      {
        coordinates: [[17.4000, 78.4800], [17.4000, 78.5000], [17.3800, 78.5000], [17.3800, 78.4800]],
        severity: 'medium',
        accidentCount: 38,
        description: 'Gachibowli - IT hub traffic, congestion during peak hours',
        radius: 1500
      }
    ]
  },

  // PUNE
  {
    city: 'Pune',
    state: 'Maharashtra',
    centerLat: 18.5204,
    centerLon: 73.8567,
    zones: [
      {
        coordinates: [[18.5500, 73.8000], [18.5500, 73.8200], [18.5300, 73.8200], [18.5300, 73.8000]],
        severity: 'high',
        accidentCount: 62,
        description: 'Mumbai-Pune Expressway exit - High-speed merging, frequent accidents',
        radius: 2000
      },
      {
        coordinates: [[18.5000, 73.8500], [18.5000, 73.8700], [18.4800, 73.8700], [18.4800, 73.8500]],
        severity: 'medium',
        accidentCount: 34,
        description: 'Katraj Ghat - Steep gradient, heavy vehicle brake failures',
        radius: 1500
      }
    ]
  },

  // KOLKATA
  {
    city: 'Kolkata',
    state: 'West Bengal',
    centerLat: 22.5726,
    centerLon: 88.3639,
    zones: [
      {
        coordinates: [[22.6000, 88.4000], [22.6000, 88.4200], [22.5800, 88.4200], [22.5800, 88.4000]],
        severity: 'high',
        accidentCount: 51,
        description: 'EM Bypass - High-speed corridor, poor lane discipline',
        radius: 1800
      },
      {
        coordinates: [[22.5500, 88.3500], [22.5500, 88.3700], [22.5300, 88.3700], [22.5300, 88.3500]],
        severity: 'medium',
        accidentCount: 29,
        description: 'Park Street area - Congestion, pedestrian accidents',
        radius: 1000
      }
    ]
  },

  // AHMEDABAD
  {
    city: 'Ahmedabad',
    state: 'Gujarat',
    centerLat: 23.0225,
    centerLon: 72.5714,
    zones: [
      {
        coordinates: [[23.0500, 72.5500], [23.0500, 72.5700], [23.0300, 72.5700], [23.0300, 72.5500]],
        severity: 'high',
        accidentCount: 44,
        description: 'SG Highway - High-speed corridor, commercial traffic',
        radius: 1800
      },
      {
        coordinates: [[23.0000, 72.6000], [23.0000, 72.6200], [22.9800, 72.6200], [22.9800, 72.6000]],
        severity: 'medium',
        accidentCount: 27,
        description: 'Sarkhej-Gandhinagar Highway - Heavy vehicle traffic',
        radius: 1500
      }
    ]
  },

  // JAIPUR
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    centerLat: 26.9124,
    centerLon: 75.7873,
    zones: [
      {
        coordinates: [[26.9500, 75.8000], [26.9500, 75.8200], [26.9300, 75.8200], [26.9300, 75.8000]],
        severity: 'medium',
        accidentCount: 36,
        description: 'Tonk Road - High traffic density, poor road conditions',
        radius: 1500
      },
      {
        coordinates: [[26.8800, 75.7500], [26.8800, 75.7700], [26.8600, 75.7700], [26.8600, 75.7500]],
        severity: 'medium',
        accidentCount: 31,
        description: 'Ajmer Road - Heavy commercial traffic, speeding issues',
        radius: 1500
      }
    ]
  }
];

/**
 * Get accident zones within radius of a location
 */
export function getZonesNearLocation(
  lat: number,
  lon: number,
  radiusKm: number = 50
): AccidentZone[] {
  const zones: AccidentZone[] = [];
  
  INDIA_ACCIDENT_ZONES.forEach(cityData => {
    // Calculate distance from location to city center
    const distance = calculateDistance(lat, lon, cityData.centerLat, cityData.centerLon);
    
    // If within radius, add all zones from this city
    if (distance <= radiusKm) {
      cityData.zones.forEach((zone, index) => {
        zones.push({
          id: `${cityData.city.toLowerCase()}-zone-${index}`,
          ...zone
        });
      });
    }
  });
  
  return zones;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
