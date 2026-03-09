import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { POI } from '../../types/map';
import { 
  Hospital, 
  ShieldAlert, 
  Fuel, 
  Coffee, 
  Wrench 
} from 'lucide-react';

export interface POIMarkersProps {
  map: L.Map | null;
  pois: POI[];
  categoryFilter?: POI['category'] | 'all';
  onPOIClick?: (poi: POI) => void;
}

export function POIMarkers({ 
  map, 
  pois, 
  categoryFilter = 'all',
  onPOIClick 
}: POIMarkersProps) {
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current.clear();

    // Filter POIs by category
    const filteredPOIs = categoryFilter === 'all' 
      ? pois 
      : pois.filter(poi => poi.category === categoryFilter);

    // Add new markers
    filteredPOIs.forEach(poi => {
      const icon = createPOIIcon(poi.category);
      
      const marker = L.marker(poi.coordinates, { icon })
        .addTo(map);

      // Add popup with POI details
      marker.bindPopup(`
        <div style="font-family: system-ui; padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1e293b;">
            ${poi.name}
          </h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
            <strong>Type:</strong> ${getCategoryLabel(poi.category)}
          </p>
          ${poi.description ? `
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
              ${poi.description}
            </p>
          ` : ''}
          ${poi.phone ? `
            <p style="margin: 0; font-size: 12px; color: #3b82f6;">
              <strong>Phone:</strong> ${poi.phone}
            </p>
          ` : ''}
        </div>
      `);

      // Add click handler
      if (onPOIClick) {
        marker.on('click', () => {
          onPOIClick(poi);
        });
      }

      markersRef.current.set(poi.id, marker);
    });

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(marker => {
        if (map) {
          map.removeLayer(marker);
        }
      });
      markersRef.current.clear();
    };
  }, [map, pois, categoryFilter, onPOIClick]);

  return null; // This component doesn't render anything directly
}

function createPOIIcon(category: POI['category']): L.DivIcon {
  const { color, icon } = getCategoryStyle(category);
  
  return L.divIcon({
    className: 'custom-poi-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${icon}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

function getCategoryStyle(category: POI['category']): { color: string; icon: string } {
  switch (category) {
    case 'hospital':
      return {
        color: '#ef4444', // red-500
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12"/><path d="M6 12h12"/></svg>'
      };
    case 'police':
      return {
        color: '#3b82f6', // blue-500
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>'
      };
    case 'gas_station':
      return {
        color: '#10b981', // green-500
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2h12"/><path d="M3 2v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2"/><path d="M11 2v13"/><path d="M18 13V6a2 2 0 0 0-2-2h-1"/><path d="M3 6h12"/><path d="M21 15v4"/><path d="M21 19h-3"/></svg>'
      };
    case 'rest_area':
      return {
        color: '#f59e0b', // amber-500
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="8"/><line x1="10" x2="10" y1="2" y2="8"/><line x1="14" x2="14" y1="2" y2="8"/></svg>'
      };
    case 'mechanic':
      return {
        color: '#8b5cf6', // violet-500
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
      };
  }
}

function getCategoryLabel(category: POI['category']): string {
  switch (category) {
    case 'hospital':
      return 'Hospital';
    case 'police':
      return 'Police Station';
    case 'gas_station':
      return 'Gas Station';
    case 'rest_area':
      return 'Rest Area';
    case 'mechanic':
      return 'Mechanic';
  }
}
