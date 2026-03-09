import { useState, useEffect, useRef } from 'react';
import type { CrashEvent, AccelerometerCrashMetadata } from '../types';
import { 
  CrashDetectionTracker, 
  analyzeCrashIndicators, 
  checkSuddenDeceleration,
  checkSpeedToZero,
  checkVehicleTilt,
  checkImpactVibration,
  checkNoMovement,
  checkRapidRotation,
  checkSustainedImpact,
  type CrashIndicators,
  type CrashDetectionResult
} from '../utils/crashDetection';
import { reportCrashEvent } from '../services/crashService';

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [gpsSpeed, setGpsSpeed] = useState<number>(0);
  const [previousPosition, setPreviousPosition] = useState<{ coords: GeolocationCoordinates; timestamp: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position.coords);
        
        // Method 1: Use GPS speed if available and accurate
        if (position.coords.speed !== null && position.coords.speed >= 0) {
          // Convert m/s to km/h: 1 m/s = 3.6 km/h
          const currentGpsSpeed = position.coords.speed * 3.6;
          
          // Only use GPS speed if accuracy is good (< 20m)
          if (position.coords.accuracy < 20) {
            // Apply smoothing: exponential moving average (EMA)
            setGpsSpeed(prevSpeed => {
              const smoothedSpeed = (currentGpsSpeed * 0.3) + (prevSpeed * 0.7);
              return Math.max(0, Math.round(smoothedSpeed * 10) / 10);
            });
          } else {
            // Low accuracy, use raw GPS speed but with more smoothing
            setGpsSpeed(prevSpeed => {
              const smoothedSpeed = (currentGpsSpeed * 0.2) + (prevSpeed * 0.8);
              return Math.max(0, Math.round(smoothedSpeed * 10) / 10);
            });
          }
        } 
        // Method 2: Calculate speed from distance/time if GPS speed unavailable
        else if (previousPosition) {
          const timeDiff = (position.timestamp - previousPosition.timestamp) / 1000; // seconds
          
          if (timeDiff > 0 && timeDiff < 5) {
            // Haversine formula for distance between two GPS coordinates
            const R = 6371000; // Earth's radius in meters
            const lat1 = previousPosition.coords.latitude * Math.PI / 180;
            const lat2 = position.coords.latitude * Math.PI / 180;
            const deltaLat = (position.coords.latitude - previousPosition.coords.latitude) * Math.PI / 180;
            const deltaLon = (position.coords.longitude - previousPosition.coords.longitude) * Math.PI / 180;

            const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                     Math.cos(lat1) * Math.cos(lat2) *
                     Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c; // meters

            // Calculate speed: distance / time, then convert to km/h
            const calculatedSpeed = (distance / timeDiff) * 3.6;
            
            // Apply smoothing and reasonable limits (max 200 km/h)
            if (calculatedSpeed < 200) {
              setGpsSpeed(prevSpeed => {
                const smoothedSpeed = (calculatedSpeed * 0.3) + (prevSpeed * 0.7);
                return Math.max(0, Math.round(smoothedSpeed * 10) / 10);
              });
            }
          }
        }
        
        // Store current position for next calculation
        setPreviousPosition({
          coords: position.coords,
          timestamp: position.timestamp
        });
      },
      (err) => setError(err.message),
      { 
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [previousPosition]);

  return { location, speed, gpsSpeed, setSpeed, error };
}

export function useAccelerometer() {
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [isCrashDetected, setIsCrashDetected] = useState(false);
  const [gForce, setGForce] = useState(0);
  const [lastCrashEvent, setLastCrashEvent] = useState<CrashEvent | null>(null);
  const [crashDetectionResult, setCrashDetectionResult] = useState<CrashDetectionResult | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [accelerometerSpeed, setAccelerometerSpeed] = useState<number>(0);
  const previousVelocityRef = useRef<{ vx: number; vy: number; vz: number; timestamp: number }>({ 
    vx: 0, vy: 0, vz: 0, timestamp: Date.now() 
  });
  const crashTrackerRef = useRef<CrashDetectionTracker>(new CrashDetectionTracker());
  const audioDetectedRef = useRef<boolean>(false);

  // Get current location for crash events
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Listen for audio crash detection events
  useEffect(() => {
    const handleAudioCrash = () => {
      audioDetectedRef.current = true;
      // Reset after 5 seconds
      setTimeout(() => {
        audioDetectedRef.current = false;
      }, 5000);
    };

    window.addEventListener('audio-crash-detected', handleAudioCrash);
    return () => window.removeEventListener('audio-crash-detected', handleAudioCrash);
  }, []);

  // Listen for gyroscope data (rotation rate from DeviceMotionEvent)
  useEffect(() => {
    const handleMotionForRotation = (event: DeviceMotionEvent) => {
      if (event.rotationRate) {
        setRotation({
          alpha: event.rotationRate.alpha || 0,
          beta: event.rotationRate.beta || 0,
          gamma: event.rotationRate.gamma || 0
        });
      }
    };

    window.addEventListener('devicemotion', handleMotionForRotation);
    return () => window.removeEventListener('devicemotion', handleMotionForRotation);
  }, []);

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (acc) {
        const x = acc.x || 0;
        const y = acc.y || 0;
        const z = acc.z || 0;
        setAcceleration({ x, y, z });

        // Calculate G-Force
        const force = Math.sqrt(x * x + y * y + z * z) / 9.81;
        setGForce(force);

        // Calculate acceleration magnitude for tracking
        const accelMagnitude = Math.sqrt(x * x + y * y + z * z);
        crashTrackerRef.current.updateAcceleration(accelMagnitude);
        crashTrackerRef.current.updateGForce(force);

        // Calculate speed from accelerometer using integration
        const currentTime = Date.now();
        const timeDiff = (currentTime - previousVelocityRef.current.timestamp) / 1000; // seconds

        if (timeDiff > 0 && timeDiff < 1) {
          const gravityMagnitude = 9.81;
          const totalAccel = Math.sqrt(x * x + y * y + z * z);
          const actualAccel = Math.max(0, totalAccel - gravityMagnitude);
          const deltaV = actualAccel * timeDiff;
          const decayFactor = 0.95;
          const newVelocity = (previousVelocityRef.current.vx + deltaV) * decayFactor;
          const speedKmh = Math.abs(newVelocity) * 3.6;
          
          setAccelerometerSpeed(prevSpeed => {
            const smoothedSpeed = (speedKmh * 0.4) + (prevSpeed * 0.6);
            const finalSpeed = Math.min(200, Math.max(0, Math.round(smoothedSpeed * 10) / 10));
            
            // Update speed history in crash tracker
            crashTrackerRef.current.updateSpeed(finalSpeed);
            
            return finalSpeed;
          });

          previousVelocityRef.current = {
            vx: newVelocity,
            vy: 0,
            vz: 0,
            timestamp: currentTime
          };
        }

        // Multi-factor crash detection
        const currentSpeed = accelerometerSpeed;
        const previousSpeed = crashTrackerRef.current.getPreviousSpeed(1);
        
        // Check all 10 indicators
        const indicators: CrashIndicators = {
          highGForce: force > 4.0,
          suddenDeceleration: checkSuddenDeceleration(currentSpeed, previousSpeed, timeDiff),
          audioDetection: audioDetectedRef.current,
          airbagDeployment: false, // Not available in browser
          vehicleTilt: checkVehicleTilt(x, y, z),
          impactVibration: checkImpactVibration(crashTrackerRef.current.getAccelerationHistory()),
          speedToZero: checkSpeedToZero(currentSpeed, previousSpeed, timeDiff),
          noMovement: checkNoMovement(
            currentSpeed,
            accelMagnitude,
            crashTrackerRef.current.updateNoMovementTracking(currentSpeed, accelMagnitude)
          ),
          rapidRotation: checkRapidRotation(rotation.alpha, rotation.beta, rotation.gamma),
          sustainedImpact: checkSustainedImpact(crashTrackerRef.current.getGForceHistory())
        };

        // Analyze indicators
        const result = analyzeCrashIndicators(indicators);
        setCrashDetectionResult(result);

        // Trigger crash detection if threshold met (5+ indicators)
        if (result.isCrash && !isCrashDetected) {
          const crashEvent: CrashEvent = {
            id: `multi-factor-crash-${Date.now()}`,
            timestamp: Date.now(),
            source: 'accelerometer',
            location: location || undefined,
            severity: result.confidence > 75 ? 'high' : result.confidence > 50 ? 'medium' : 'low',
            metadata: {
              gForce: force,
              acceleration: { x, y, z },
              indicators: result.triggeredIndicators,
              confidence: result.confidence,
              indicatorCount: result.indicatorCount
            } as AccelerometerCrashMetadata
          };

          setLastCrashEvent(crashEvent);
          setIsCrashDetected(true);

          try {
            const existingEvents = localStorage.getItem('crash_events');
            const events: CrashEvent[] = existingEvents ? JSON.parse(existingEvents) : [];
            events.push(crashEvent);
            localStorage.setItem('crash_events', JSON.stringify(events));
            window.dispatchEvent(new CustomEvent('crash-detected', { detail: crashEvent }));

            if (location) {
              void reportCrashEvent({
                location,
                severity: crashEvent.severity,
                indicatorsTriggered: result.triggeredIndicators,
                confidence: result.confidence,
                indicatorCount: result.indicatorCount,
                gForce: force,
                speed: currentSpeed,
                sosTriggered: false,
              }).catch((reportError) => {
                console.error('Failed to persist crash event:', reportError);
              });
            }
          } catch (error) {
            console.error('Failed to store crash event:', error);
          }
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [location, accelerometerSpeed, isCrashDetected, rotation]);

  return { 
    acceleration, 
    gForce, 
    isCrashDetected, 
    lastCrashEvent, 
    crashDetectionResult,
    accelerometerSpeed, 
    setIsCrashDetected 
  };
}
