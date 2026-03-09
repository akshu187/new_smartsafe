import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useMap } from '../hooks/useMap';
import { useAccidentZones } from '../hooks/useAccidentZones';
import { useReverseGeocode } from '../hooks/useReverseGeocode';
import { AccidentZoneLayer } from './map/AccidentZoneLayer';
import { POIMarkers } from './map/POIMarkers';
import { SpeedOverlay } from './map/SpeedOverlay';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, AlertCircle, WifiOff, Wifi, Navigation, Layers } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapComponentProps {
  currentLocation: GeolocationCoordinates | null;
  speed?: number;
  className?: string;
}

export function MapComponent({ currentLocation, speed = 0, className = '' }: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  const [showPOIs, setShowPOIs] = useState(true);
  const [showAccidentZones, setShowAccidentZones] = useState(true);
  
  const { mapRef, isInitialized, error, isOffline, initializeMap, updateCenter } = useMap({
    initialCenter: currentLocation 
      ? [currentLocation.latitude, currentLocation.longitude]
      : [0, 0],
    initialZoom: 15
  });

  // Fetch accident zones based on current location
  const { zones, isLoading: zonesLoading, error: zonesError } = useAccidentZones({
    location: currentLocation ? {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    } : null,
    radius: 50,
    enabled: showAccidentZones
  });

  // Get current location address
  const { address, isLoading: addressLoading } = useReverseGeocode({
    location: currentLocation ? {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    } : null,
    enabled: true
  });

  // Initialize map on mount
  useEffect(() => {
    if (containerRef.current && !isInitialized) {
      initializeMap(containerRef.current);
    }
  }, [isInitialized, initializeMap]);

  // Update current location marker with Google Maps style
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    const position: [number, number] = [
      currentLocation.latitude,
      currentLocation.longitude
    ];

    // Get user initial (from email or default to 'D' for Driver)
    const userInitial = 'D'; // TODO: Get from logged-in user
    
    // Always recreate marker to ensure updates
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    // Create new marker with CAR ICON + USER INITIAL
    const customIcon = L.divIcon({
      className: 'custom-location-marker',
      html: `
        <div style="position: relative; width: 60px; height: 60px;">
          <!-- Large outer pulse ring -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90px;
            height: 90px;
            background: rgba(16, 185, 129, 0.25);
            border-radius: 50%;
            animation: locationPulse 2s ease-out infinite;
          "></div>
          
          <!-- Medium pulse ring -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70px;
            height: 70px;
            background: rgba(16, 185, 129, 0.35);
            border-radius: 50%;
            animation: locationPulse 2s ease-out infinite 0.5s;
          "></div>
          
          <!-- Car icon with user initial -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(16, 185, 129, 0.6);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1;
          ">
            <!-- Car emoji -->
            <div style="font-size: 24px; line-height: 1; margin-bottom: 2px;">🚗</div>
            <!-- User initial -->
            <div style="
              font-size: 14px;
              font-weight: bold;
              color: white;
              line-height: 1;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            ">${userInitial}</div>
          </div>
          
          <!-- Direction indicator (small arrow on top) -->
          <div style="
            position: absolute;
            top: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 10px solid #10b981;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
          "></div>
          
          <!-- Label below -->
          <div style="
            position: absolute;
            top: 64px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            YOU
          </div>
        </div>
        <style>
          @keyframes locationPulse {
            0% {
              transform: translate(-50%, -50%) scale(0.5);
              opacity: 0.8;
            }
            100% {
              transform: translate(-50%, -50%) scale(1.5);
              opacity: 0;
            }
          }
        </style>
      `,
      iconSize: [60, 60],
      iconAnchor: [30, 30]
    });

    markerRef.current = L.marker(position, { icon: customIcon })
      .addTo(mapRef.current)
      .bindPopup(`
        <div style="font-family: system-ui; padding: 12px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #10b981; display: flex; align-items: center; gap: 8px;">
            🚗 Your Current Location
          </h3>
          <div style="background: #f0fdf4; padding: 8px; border-radius: 8px; margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #166534;">
              <strong>Latitude:</strong> ${currentLocation.latitude.toFixed(6)}
            </p>
            <p style="margin: 0 0 4px 0; font-size: 13px; color: #166534;">
              <strong>Longitude:</strong> ${currentLocation.longitude.toFixed(6)}
            </p>
            <p style="margin: 0; font-size: 13px; color: #166534;">
              <strong>Accuracy:</strong> ±${Math.round(currentLocation.accuracy)}m
            </p>
          </div>
          <p style="margin: 0; font-size: 11px; color: #64748b; text-align: center;">
            🧭 Real-time GPS tracking active
          </p>
        </div>
      `);

    // Center map on current location once when first GPS fix arrives.
    if (!hasCenteredOnUserRef.current) {
      updateCenter(position);
      hasCenteredOnUserRef.current = true;
    }
  }, [currentLocation, mapRef, updateCenter]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [mapRef]);

  // Recenter map on current location
  const handleRecenter = () => {
    if (currentLocation && mapRef.current) {
      const position: [number, number] = [
        currentLocation.latitude,
        currentLocation.longitude
      ];
      mapRef.current.setView(position, 15, { animate: true });
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 ${className}`}
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Map Unavailable</h3>
        <p className="text-sm text-slate-400 text-center max-w-sm">
          {error === 'Geolocation is not supported' 
            ? 'Location services are disabled. Please enable GPS to use map features.'
            : error}
        </p>
      </motion.div>
    );
  }

  if (!currentLocation) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 ${className}`}
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Waiting for Location</h3>
        <p className="text-sm text-slate-400 text-center max-w-sm">
          Please enable location services to view the map.
        </p>
      </motion.div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Offline Indicator */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Offline mode - showing cached map data</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Location Address Display */}
      {address && !addressLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs"
        >
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1">📍 You are here:</div>
              <div className="text-sm font-medium text-slate-900 leading-tight">{address.displayName}</div>
              <div className="text-xs text-slate-500 mt-1">
                {address.city}, {address.state}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Address Loading Indicator */}
      {addressLoading && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-600">Getting your location...</span>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-lg flex items-center justify-center transition-colors"
          title="Recenter map"
        >
          <Navigation className="w-5 h-5 text-slate-700" />
        </button>

        {/* Toggle Layers */}
        <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2">
          <button
            onClick={() => setShowAccidentZones(!showAccidentZones)}
            className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
              showAccidentZones 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
            }`}
            title="Toggle accident zones"
          >
            Zones
          </button>
          <button
            onClick={() => setShowPOIs(!showPOIs)}
            className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
              showPOIs 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
            }`}
            title="Toggle POIs"
          >
            POIs
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-slate-400">Loading map...</p>
          </div>
        </div>
      )}

      {/* Zones Loading Indicator */}
      {zonesLoading && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Loading accident zones...</span>
        </div>
      )}

      {/* Zones Info Panel */}
      {!zonesLoading && zones.length > 0 && showAccidentZones && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs font-medium">{zones.filter(z => z.severity === 'high').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-xs font-medium">{zones.filter(z => z.severity === 'medium').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs font-medium">{zones.filter(z => z.severity === 'low').length}</span>
            </div>
            <span className="text-xs font-medium ml-2">zones detected</span>
          </div>
        </motion.div>
      )}

      {!zonesLoading && zonesError && showAccidentZones && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-red-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg">
          <span className="text-xs font-medium">{zonesError}</span>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: '400px' }}
      />

      {/* Render map layers */}
      {mapRef.current && currentLocation && (
        <>
          {/* Accident Zones Layer */}
          {showAccidentZones && (
            <AccidentZoneLayer
              map={mapRef.current}
              zones={zones}
              currentLocation={[currentLocation.latitude, currentLocation.longitude]}
            />
          )}

          {/* Speed Overlay */}
          <SpeedOverlay
            speed={speed}
            unit="km/h"
            className="absolute bottom-4 right-4 z-[999]"
          />
        </>
      )}
    </div>
  );
}
