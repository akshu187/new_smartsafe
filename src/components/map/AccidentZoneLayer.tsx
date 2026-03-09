import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AccidentZone } from '../../types/map';

export interface AccidentZoneLayerProps {
  map: L.Map | null;
  zones: AccidentZone[];
  currentLocation: [number, number] | null;
  onZoneClick?: (zone: AccidentZone) => void;
}

export function AccidentZoneLayer({ 
  map, 
  zones, 
  currentLocation,
  onZoneClick 
}: AccidentZoneLayerProps) {
  const layersRef = useRef<Map<string, { polygon: L.Polygon; circle: L.Circle; marker: L.Marker }>>(new Map());

  useEffect(() => {
    if (!map) return;

    // Clear existing layers
    layersRef.current.forEach(({ polygon, circle, marker }) => {
      map.removeLayer(polygon);
      map.removeLayer(circle);
      map.removeLayer(marker);
    });
    layersRef.current.clear();

    // Add new zones with enhanced visibility
    zones.forEach(zone => {
      const { color, fillColor, borderColor } = getSeverityColors(zone.severity);
      const isInZone = currentLocation && isLocationInZone(currentLocation, zone);

      // Calculate center of zone for marker
      const center = getPolygonCenter(zone.coordinates);

      // 1. Create filled polygon area (removed - only keeping icon)
      // Polygon removed for cleaner look

      // 2. Create outer circle (removed - only keeping icon)
      // Circle removed for cleaner look

      // 3. Create center marker with icon (ONLY THIS REMAINS)
      const markerIcon = L.divIcon({
        className: 'accident-zone-marker',
        html: `
          <div style="
            position: relative;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <!-- Subtle pulse animation -->
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              background: ${color};
              border-radius: 50%;
              opacity: 0.3;
              animation: zonePulse 2s ease-out infinite;
            "></div>
            <!-- Main icon circle -->
            <div style="
              position: relative;
              width: 40px;
              height: 40px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 3px 10px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              z-index: 1;
            ">
              ${getSeverityIcon(zone.severity)}
            </div>
          </div>
          <style>
            @keyframes zonePulse {
              0% {
                transform: scale(0.8);
                opacity: 0.5;
              }
              100% {
                transform: scale(1.6);
                opacity: 0;
              }
            }
          </style>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const marker = L.marker(center, { icon: markerIcon }).addTo(map);

      // Add detailed popup
      const popupContent = `
        <div style="font-family: system-ui; padding: 12px; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div style="
              width: 24px;
              height: 24px;
              background: ${color};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
            ">
              ${getSeverityIcon(zone.severity)}
            </div>
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: ${color};">
              ${getSeverityLabel(zone.severity)} Risk Zone
            </h3>
          </div>
          
          <div style="background: #f1f5f9; padding: 8px; border-radius: 8px; margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #475569;">
              <strong>⚠️ Accidents Reported:</strong> ${zone.accidentCount}
            </p>
            <p style="margin: 0; font-size: 13px; color: #475569;">
              <strong>📍 Zone Radius:</strong> ${Math.round(zone.radius)}m
            </p>
          </div>
          
          <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
            ${zone.description}
          </p>
          
          ${isInZone ? `
            <div style="
              margin-top: 8px;
              padding: 6px 12px;
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              color: #92400e;
              text-align: center;
            ">
              ⚠️ YOU ARE IN THIS ZONE - DRIVE CAREFULLY
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      if (onZoneClick) {
        marker.on('click', () => onZoneClick(zone));
      }

      // Add hover effects
      marker.on('mouseover', () => {
        marker.getElement()?.style.setProperty('transform', 'scale(1.2)');
      });
      marker.on('mouseout', () => {
        marker.getElement()?.style.setProperty('transform', 'scale(1)');
      });

      layersRef.current.set(zone.id, { polygon: marker as any, circle: marker as any, marker });
    });

    // Cleanup on unmount
    return () => {
      layersRef.current.forEach(({ marker }) => {
        if (map) {
          map.removeLayer(marker);
        }
      });
      layersRef.current.clear();
    };
  }, [map, zones, currentLocation, onZoneClick]);

  return null; // This component doesn't render anything directly
}

function getSeverityColors(severity: 'low' | 'medium' | 'high'): { 
  color: string; 
  fillColor: string; 
  borderColor: string;
} {
  switch (severity) {
    case 'low':
      return {
        color: '#fbbf24',      // amber-400 - Yellow
        fillColor: '#fef3c7',  // amber-100
        borderColor: '#f59e0b' // amber-500
      };
    case 'medium':
      return {
        color: '#f97316',      // orange-500 - Orange
        fillColor: '#fed7aa',  // orange-200
        borderColor: '#ea580c' // orange-600
      };
    case 'high':
      return {
        color: '#ef4444',      // red-500 - Red
        fillColor: '#fecaca',  // red-200
        borderColor: '#dc2626' // red-600
      };
  }
}

function getSeverityLabel(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
  }
}

function getSeverityIcon(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return '⚠️'; // Warning sign for low
    case 'medium':
      return '⚠️'; // Warning sign for medium
    case 'high':
      return '🚨'; // Police light for high
  }
}

function isLocationInZone(location: [number, number], zone: AccidentZone): boolean {
  // Simple point-in-polygon check using ray casting algorithm
  const [lat, lng] = location;
  let inside = false;

  for (let i = 0, j = zone.coordinates.length - 1; i < zone.coordinates.length; j = i++) {
    const [xi, yi] = zone.coordinates[i];
    const [xj, yj] = zone.coordinates[j];

    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

function getPolygonCenter(coordinates: [number, number][]): [number, number] {
  let latSum = 0;
  let lngSum = 0;
  
  coordinates.forEach(([lat, lng]) => {
    latSum += lat;
    lngSum += lng;
  });
  
  return [latSum / coordinates.length, lngSum / coordinates.length];
}
