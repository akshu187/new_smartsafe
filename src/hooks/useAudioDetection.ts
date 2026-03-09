import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeAudio, getSensitivityThresholds } from '../utils/audioAnalysis';
import type { CrashEvent, AudioCrashMetadata } from '../types';
import { reportCrashEvent } from '../services/crashService';

export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface AudioDetectionConfig {
  enabled: boolean;
  sensitivity: SensitivityLevel;
  thresholds: {
    amplitude: number;
    frequency: { min: number; max: number };
    duration: number;
  };
}

export interface UseAudioDetectionReturn {
  isActive: boolean;
  isPermissionGranted: boolean;
  sensitivity: SensitivityLevel;
  isCrashDetected: boolean;
  lastCrashEvent: CrashEvent | null;
  requestPermission: () => Promise<void>;
  setSensitivity: (level: SensitivityLevel) => void;
  testDetection: () => void;
  enable: () => void;
  disable: () => void;
}

const STORAGE_KEY = 'smartsafe_audio_config';

// Sensitivity thresholds based on design document
const SENSITIVITY_CONFIGS: Record<SensitivityLevel, AudioDetectionConfig['thresholds']> = {
  low: {
    amplitude: 85, // dB
    frequency: { min: 100, max: 500 }, // Hz
    duration: 500 // ms
  },
  medium: {
    amplitude: 80,
    frequency: { min: 100, max: 500 },
    duration: 350
  },
  high: {
    amplitude: 75,
    frequency: { min: 100, max: 500 },
    duration: 200
  }
};

/**
 * Hook for audio-based crash detection using Web Audio API
 */
export function useAudioDetection(): UseAudioDetectionReturn {
  const [isActive, setIsActive] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [sensitivity, setSensitivityState] = useState<SensitivityLevel>('medium');
  const [isCrashDetected, setIsCrashDetected] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastCrashEvent, setLastCrashEvent] = useState<CrashEvent | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const isInitializingRef = useRef(false);

  // Get current location for crash events
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        locationRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Load saved configuration
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const config: AudioDetectionConfig = JSON.parse(savedConfig);
        setSensitivityState(config.sensitivity);
        setIsEnabled(config.enabled);
      }
    } catch (error) {
      console.error('Failed to load audio config:', error);
    }
  }, []);

  // Save configuration when it changes
  const saveConfig = useCallback((enabled: boolean, level: SensitivityLevel) => {
    const config: AudioDetectionConfig = {
      enabled,
      sensitivity: level,
      thresholds: SENSITIVITY_CONFIGS[level]
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save audio config:', error);
    }
  }, []);

  // Audio analysis loop
  const startAnalysisLoop = useCallback((analyser: AnalyserNode) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const analyze = () => {
      if (!analyserRef.current) return;

      // Get time domain data
      analyser.getFloatTimeDomainData(dataArray);

      // Get current thresholds based on sensitivity
      const thresholds = getSensitivityThresholds(sensitivity);

      // Analyze audio for crash patterns
      const result = analyzeAudio(dataArray, thresholds);

      if (result.isCrash) {
        console.log('Crash detected via audio!', result);
        
        // Create crash event
        const crashEvent: CrashEvent = {
          id: `audio-crash-${Date.now()}`,
          timestamp: Date.now(),
          source: 'audio',
          location: locationRef.current || undefined,
          severity: result.confidence > 0.8 ? 'high' : result.confidence > 0.5 ? 'medium' : 'low',
          metadata: {
            amplitude: result.amplitude,
            dominantFrequency: result.dominantFrequency,
            confidence: result.confidence,
            sustainedDuration: result.sustainedDuration,
            sensitivity
          } as AudioCrashMetadata
        };

        setLastCrashEvent(crashEvent);
        setIsCrashDetected(true);
        
        // Notify accelerometer hook about audio detection
        window.dispatchEvent(new CustomEvent('audio-crash-detected'));
        
        // Trigger emergency response (store in localStorage for persistence)
        try {
          const existingEvents = localStorage.getItem('crash_events');
          const events: CrashEvent[] = existingEvents ? JSON.parse(existingEvents) : [];
          events.push(crashEvent);
          localStorage.setItem('crash_events', JSON.stringify(events));
          
          // Dispatch custom event for emergency response workflow
          window.dispatchEvent(new CustomEvent('crash-detected', { detail: crashEvent }));

          if (locationRef.current) {
            void reportCrashEvent({
              location: locationRef.current,
              severity: crashEvent.severity,
              indicatorsTriggered: ['audio_detection'],
              confidence: Math.round(result.confidence * 100),
              indicatorCount: 1,
              sosTriggered: false,
            }).catch((reportError) => {
              console.error('Failed to persist audio crash event:', reportError);
            });
          }
        } catch (error) {
          console.error('Failed to store crash event:', error);
        }
        
        // Reset after 3 seconds
        setTimeout(() => setIsCrashDetected(false), 3000);
      }

      // Immediately discard buffer (privacy requirement)
      dataArray.fill(0);

      // Continue analysis loop (analyze every 100ms)
      animationFrameRef.current = window.setTimeout(analyze, 100);
    };

    analyze();
  }, [sensitivity]);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    if (!isEnabled) {
      console.log('Audio detection is disabled');
      return;
    }
    if (isInitializingRef.current || isActive) {
      return;
    }

    isInitializingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsPermissionGranted(true);

      // Initialize Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setIsActive(true);

      // Start audio analysis loop
      startAnalysisLoop(analyser);

      console.log('Audio detection initialized successfully');
    } catch (error) {
      console.error('Microphone permission denied or error:', error);
      setIsPermissionGranted(false);
      setIsActive(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, [isEnabled, isActive, startAnalysisLoop]);

  // Stop audio detection
  const stopDetection = useCallback(() => {
    isInitializingRef.current = false;
    if (animationFrameRef.current) {
      clearTimeout(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsActive(false);
  }, []);

  // Enable audio detection
  const enable = useCallback(() => {
    setIsEnabled(true);
    saveConfig(true, sensitivity);
  }, [sensitivity, saveConfig]);

  // Disable audio detection
  const disable = useCallback(() => {
    setIsEnabled(false);
    saveConfig(false, sensitivity);
    stopDetection();
  }, [sensitivity, saveConfig, stopDetection]);

  // Set sensitivity level
  const setSensitivity = useCallback((level: SensitivityLevel) => {
    setSensitivityState(level);
    saveConfig(isEnabled, level);
  }, [isEnabled, saveConfig]);

  // Test detection (simulate crash sound)
  const testDetection = useCallback(() => {
    console.log('Test mode: Simulating crash detection');
    
    // Create test crash event
    const testCrashEvent: CrashEvent = {
      id: `audio-crash-test-${Date.now()}`,
      timestamp: Date.now(),
      source: 'audio',
      location: locationRef.current || undefined,
      severity: 'medium',
      metadata: {
        amplitude: 85,
        dominantFrequency: 300,
        confidence: 0.75,
        sustainedDuration: 350,
        sensitivity
      } as AudioCrashMetadata
    };

    setLastCrashEvent(testCrashEvent);
    setIsCrashDetected(true);
    
    // Dispatch test event
    window.dispatchEvent(new CustomEvent('crash-detected', { detail: testCrashEvent }));

    if (locationRef.current) {
      void reportCrashEvent({
        location: locationRef.current,
        severity: testCrashEvent.severity,
        indicatorsTriggered: ['audio_test_detection'],
        confidence: 75,
        indicatorCount: 1,
        sosTriggered: false,
      }).catch((reportError) => {
        console.error('Failed to persist test crash event:', reportError);
      });
    }
    
    setTimeout(() => setIsCrashDetected(false), 3000);
  }, [sensitivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Auto-request permission when enabled
  useEffect(() => {
    // Re-enable should always attempt to reinitialize audio pipeline, even if
    // permission was granted earlier and detection was manually turned off.
    if (isEnabled && !isActive) {
      void requestPermission();
    }
  }, [isEnabled, isActive, isPermissionGranted, requestPermission]);

  return {
    isActive,
    isPermissionGranted,
    sensitivity,
    isCrashDetected,
    lastCrashEvent,
    requestPermission,
    setSensitivity,
    testDetection,
    enable,
    disable
  };
}
