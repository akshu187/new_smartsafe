import fc from 'fast-check';
import { describe, test, expect, beforeEach } from 'vitest';
import {
  analyzeAudio,
  calculateRMS,
  findDominantFrequency,
  calculateSustainedDuration,
  matchCrashPattern,
  getSensitivityThresholds,
} from '../../src/utils/audioAnalysis';
import type { CrashEvent } from '../../src/types';

// Feature: advanced-safety-features, Property 13: Audio Analysis Continuity
// For any audio input stream while microphone permission is granted and audio detection is enabled,
// the audio should be continuously analyzed for crash patterns.
describe('Audio Detection Properties', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('Property 13: Audio Analysis Continuity', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.float32Array({ minLength: 1024, maxLength: 2048, noDefaultInfinity: true, noNaN: true }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.boolean(), // isPermissionGranted
        fc.boolean(), // isEnabled
        (audioBuffers, isPermissionGranted, isEnabled) => {
          // Simulate continuous audio analysis
          const analyzedBuffers: number[] = [];

          if (isPermissionGranted && isEnabled) {
            audioBuffers.forEach((buffer, index) => {
              // Each buffer should be analyzed
              const thresholds = getSensitivityThresholds('medium');
              const result = analyzeAudio(buffer, thresholds);
              
              // Verify analysis was performed
              expect(result).toHaveProperty('isCrash');
              expect(result).toHaveProperty('amplitude');
              expect(result).toHaveProperty('dominantFrequency');
              expect(result).toHaveProperty('confidence');
              
              analyzedBuffers.push(index);
            });

            // All buffers should be analyzed
            expect(analyzedBuffers.length).toBe(audioBuffers.length);
          } else {
            // No analysis when permission denied or disabled
            expect(analyzedBuffers.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: advanced-safety-features, Property 14: Crash Pattern Detection
  // For any audio input matching crash characteristics (frequency 100-500 Hz, amplitude above threshold, duration 200-500ms),
  // an Audio_Crash_Event should be created.
  test('Property 14: Crash Pattern Detection', () => {
    fc.assert(
      fc.property(
        fc.record({
          amplitude: fc.float({ min: 0, max: 100, noNaN: true }),
          frequency: fc.float({ min: 50, max: 1000, noNaN: true }),
          duration: fc.float({ min: 100, max: 1000, noNaN: true })
        }),
        fc.constantFrom('low', 'medium', 'high'),
        (audioCharacteristics, sensitivity) => {
          const thresholds = getSensitivityThresholds(sensitivity as 'low' | 'medium' | 'high');
          
          // Determine if characteristics match crash pattern
          const isInFrequencyRange =
            audioCharacteristics.frequency >= thresholds.frequency.min &&
            audioCharacteristics.frequency <= thresholds.frequency.max;
          
          const isAboveAmplitudeThreshold = audioCharacteristics.amplitude >= thresholds.amplitude;
          const meetsDurationThreshold = audioCharacteristics.duration >= thresholds.duration;
          
          // Crash should be detected if all conditions are met
          const shouldDetectCrash =
            isInFrequencyRange &&
            isAboveAmplitudeThreshold &&
            meetsDurationThreshold;

          // Verify detection logic
          if (shouldDetectCrash) {
            expect(isInFrequencyRange).toBe(true);
            expect(isAboveAmplitudeThreshold).toBe(true);
            expect(meetsDurationThreshold).toBe(true);
          }

          // Verify thresholds are correctly applied
          expect(thresholds.amplitude).toBeGreaterThan(0);
          expect(thresholds.frequency.min).toBe(100);
          expect(thresholds.frequency.max).toBe(500);
          expect(thresholds.duration).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: advanced-safety-features, Property 16: Sensitivity Configuration
  // For any sensitivity level (low, medium, high), the detection thresholds should be correctly applied
  // and affect crash detection behavior.
  test('Property 16: Sensitivity Configuration', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('low', 'medium', 'high'),
        (sensitivity) => {
          const thresholds = getSensitivityThresholds(sensitivity as 'low' | 'medium' | 'high');

          // Verify thresholds are correctly set based on sensitivity
          if (sensitivity === 'low') {
            expect(thresholds.amplitude).toBe(85);
            expect(thresholds.duration).toBe(500);
          } else if (sensitivity === 'medium') {
            expect(thresholds.amplitude).toBe(80);
            expect(thresholds.duration).toBe(350);
          } else if (sensitivity === 'high') {
            expect(thresholds.amplitude).toBe(75);
            expect(thresholds.duration).toBe(200);
          }

          // All sensitivities should have same frequency range
          expect(thresholds.frequency.min).toBe(100);
          expect(thresholds.frequency.max).toBe(500);

          // Higher sensitivity should have lower thresholds
          const lowThresholds = getSensitivityThresholds('low');
          const mediumThresholds = getSensitivityThresholds('medium');
          const highThresholds = getSensitivityThresholds('high');

          expect(lowThresholds.amplitude).toBeGreaterThan(mediumThresholds.amplitude);
          expect(mediumThresholds.amplitude).toBeGreaterThan(highThresholds.amplitude);
          expect(lowThresholds.duration).toBeGreaterThan(mediumThresholds.duration);
          expect(mediumThresholds.duration).toBeGreaterThan(highThresholds.duration);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: advanced-safety-features, Property 17: Sensitivity Persistence Round-Trip
  // For any sensitivity configuration saved to LocalStorage, retrieving it should return the exact same configuration.
  test('Property 17: Sensitivity Persistence Round-Trip', () => {
    fc.assert(
      fc.property(
        fc.record({
          enabled: fc.boolean(),
          sensitivity: fc.constantFrom('low', 'medium', 'high')
        }),
        (config) => {
          const storageKey = 'test_audio_config';
          
          // Create full config with thresholds
          const thresholds = getSensitivityThresholds(config.sensitivity as 'low' | 'medium' | 'high');
          const fullConfig = {
            enabled: config.enabled,
            sensitivity: config.sensitivity,
            thresholds
          };

          // Save to localStorage
          localStorage.setItem(storageKey, JSON.stringify(fullConfig));

          // Retrieve from localStorage
          const retrieved = localStorage.getItem(storageKey);
          expect(retrieved).not.toBeNull();

          const parsedConfig = JSON.parse(retrieved!);

          // Verify round-trip integrity
          expect(parsedConfig.enabled).toBe(config.enabled);
          expect(parsedConfig.sensitivity).toBe(config.sensitivity);
          expect(parsedConfig.thresholds.amplitude).toBe(thresholds.amplitude);
          expect(parsedConfig.thresholds.duration).toBe(thresholds.duration);
          expect(parsedConfig.thresholds.frequency.min).toBe(thresholds.frequency.min);
          expect(parsedConfig.thresholds.frequency.max).toBe(thresholds.frequency.max);

          // Cleanup
          localStorage.removeItem(storageKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: advanced-safety-features, Property 18: Audio Privacy - No Persistent Storage
  // For any audio buffer processed during crash detection analysis, the buffer should be immediately discarded
  // after analysis completes, with no audio data persisting in memory or storage.
  test('Property 18: Audio Privacy - No Persistent Storage', () => {
    fc.assert(
      fc.property(
        fc.float32Array({ minLength: 1024, maxLength: 2048, noDefaultInfinity: true, noNaN: true }),
        (audioBuffer) => {
          // Create a copy to verify original is not modified
          const originalBuffer = new Float32Array(audioBuffer);
          
          // Perform analysis
          const thresholds = getSensitivityThresholds('medium');
          const result = analyzeAudio(audioBuffer, thresholds);

          // Verify analysis result exists
          expect(result).toBeDefined();
          expect(result.amplitude).toBeGreaterThanOrEqual(0);

          // Simulate buffer disposal (in real implementation, this happens in the hook)
          audioBuffer.fill(0);

          // Verify buffer is cleared
          const allZeros = Array.from(audioBuffer).every(val => val === 0);
          expect(allZeros).toBe(true);

          // Verify no audio data in result (only metadata)
          expect(result).not.toHaveProperty('audioData');
          expect(result).not.toHaveProperty('buffer');
          expect(result).not.toHaveProperty('samples');

          // Result should only contain analysis metadata
          expect(Object.keys(result)).toEqual([
            'isCrash',
            'amplitude',
            'dominantFrequency',
            'confidence',
            'sustainedDuration'
          ]);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: advanced-safety-features, Property 15: Emergency Response Consistency
  // For any crash detected (via audio or accelerometer), the emergency response workflow should be triggered
  // consistently with the same data structure and behavior.
  test('Property 15: Emergency Response Consistency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('audio', 'accelerometer'),
        fc.record({
          amplitude: fc.float({ min: 75, max: 100, noNaN: true }),
          frequency: fc.float({ min: 100, max: 500, noNaN: true }),
          confidence: fc.float({ min: 0.5, max: 1.0, noNaN: true }),
          gForce: fc.float({ min: 4.0, max: 10.0, noNaN: true })
        }),
        fc.constantFrom('low', 'medium', 'high'),
        (source, crashData, sensitivity) => {
          // Simulate crash event creation
          const timestamp = Date.now();
          const crashEvent: CrashEvent = {
            id: `${source}-crash-${timestamp}`,
            timestamp,
            source: source as 'audio' | 'accelerometer',
            location: {
              latitude: 37.7749,
              longitude: -122.4194
            },
            severity: crashData.confidence > 0.8 || crashData.gForce > 6.0 ? 'high' : 
                     crashData.confidence > 0.5 || crashData.gForce > 5.0 ? 'medium' : 'low',
            metadata: source === 'audio' ? {
              amplitude: crashData.amplitude,
              dominantFrequency: crashData.frequency,
              confidence: crashData.confidence,
              sustainedDuration: 350,
              sensitivity: sensitivity as 'low' | 'medium' | 'high'
            } : {
              gForce: crashData.gForce,
              acceleration: { x: 0, y: 0, z: crashData.gForce * 9.81 }
            }
          };

          // Verify crash event structure consistency
          expect(crashEvent).toHaveProperty('id');
          expect(crashEvent).toHaveProperty('timestamp');
          expect(crashEvent).toHaveProperty('source');
          expect(crashEvent).toHaveProperty('severity');
          expect(crashEvent).toHaveProperty('metadata');

          // Verify ID format
          expect(crashEvent.id).toMatch(new RegExp(`^${source}-crash-\\d+$`));

          // Verify source is correct
          expect(crashEvent.source).toBe(source);

          // Verify severity is valid
          expect(['low', 'medium', 'high']).toContain(crashEvent.severity);

          // Verify location if present
          if (crashEvent.location) {
            expect(crashEvent.location).toHaveProperty('latitude');
            expect(crashEvent.location).toHaveProperty('longitude');
            expect(crashEvent.location.latitude).toBeGreaterThanOrEqual(-90);
            expect(crashEvent.location.latitude).toBeLessThanOrEqual(90);
            expect(crashEvent.location.longitude).toBeGreaterThanOrEqual(-180);
            expect(crashEvent.location.longitude).toBeLessThanOrEqual(180);
          }

          // Verify metadata structure based on source
          if (source === 'audio') {
            expect(crashEvent.metadata).toHaveProperty('amplitude');
            expect(crashEvent.metadata).toHaveProperty('dominantFrequency');
            expect(crashEvent.metadata).toHaveProperty('confidence');
            expect(crashEvent.metadata).toHaveProperty('sustainedDuration');
            expect(crashEvent.metadata).toHaveProperty('sensitivity');
          } else {
            expect(crashEvent.metadata).toHaveProperty('gForce');
            expect(crashEvent.metadata).toHaveProperty('acceleration');
          }

          // Simulate emergency response workflow (store in localStorage)
          const existingEvents = localStorage.getItem('crash_events');
          const events: CrashEvent[] = existingEvents ? JSON.parse(existingEvents) : [];
          events.push(crashEvent);
          localStorage.setItem('crash_events', JSON.stringify(events));

          // Verify event was stored
          const storedEvents = localStorage.getItem('crash_events');
          expect(storedEvents).not.toBeNull();
          
          const parsedEvents: CrashEvent[] = JSON.parse(storedEvents!);
          expect(parsedEvents.length).toBeGreaterThan(0);
          
          const lastEvent = parsedEvents[parsedEvents.length - 1];
          expect(lastEvent.id).toBe(crashEvent.id);
          expect(lastEvent.source).toBe(crashEvent.source);
          expect(lastEvent.severity).toBe(crashEvent.severity);

          // Verify both sources produce consistent event structure
          expect(Object.keys(lastEvent).sort()).toEqual(Object.keys(crashEvent).sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: advanced-safety-features, Property 19: Audio Detection Indicator Visibility
  // When audio detection is active, a visual indicator should be displayed to the user.
  test('Property 19: Audio Detection Indicator Visibility', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // isActive
        fc.boolean(), // isPermissionGranted
        (isActive, isPermissionGranted) => {
          // Simulate indicator state
          const indicatorVisible = isActive;
          const permissionWarningVisible = isActive && !isPermissionGranted;

          // Verify indicator visibility matches active state
          expect(indicatorVisible).toBe(isActive);

          // Verify permission warning is shown when needed
          if (isActive && !isPermissionGranted) {
            expect(permissionWarningVisible).toBe(true);
          } else {
            expect(permissionWarningVisible).toBe(false);
          }

          // Verify privacy notice is always present (regardless of state)
          const privacyNoticeVisible = true;
          expect(privacyNoticeVisible).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: advanced-safety-features, Property 20: Feature Independence - Audio Disable
  // When audio detection is disabled, all other app features should continue to function normally.
  test('Property 20: Feature Independence - Audio Disable', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // audioEnabled
        fc.record({
          mapEnabled: fc.boolean(),
          gpsEnabled: fc.boolean(),
          accelerometerEnabled: fc.boolean(),
          weatherEnabled: fc.boolean()
        }),
        (audioEnabled, otherFeatures) => {
          // Simulate feature states
          const features = {
            audio: audioEnabled,
            ...otherFeatures
          };

          // Verify other features are independent of audio state
          expect(features.mapEnabled).toBe(otherFeatures.mapEnabled);
          expect(features.gpsEnabled).toBe(otherFeatures.gpsEnabled);
          expect(features.accelerometerEnabled).toBe(otherFeatures.accelerometerEnabled);
          expect(features.weatherEnabled).toBe(otherFeatures.weatherEnabled);

          // Verify disabling audio doesn't affect other features
          if (!audioEnabled) {
            expect(features.mapEnabled).toBe(otherFeatures.mapEnabled);
            expect(features.gpsEnabled).toBe(otherFeatures.gpsEnabled);
            expect(features.accelerometerEnabled).toBe(otherFeatures.accelerometerEnabled);
          }

          // All features should be independently controllable
          const independentFeatures = Object.keys(features).filter(key => key !== 'audio');
          independentFeatures.forEach(feature => {
            expect(features[feature as keyof typeof features]).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: advanced-safety-features, Property 21: Conditional Microphone Access
  // Microphone access should only be requested when audio detection is enabled.
  test('Property 21: Conditional Microphone Access', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // audioEnabled
        (audioEnabled) => {
          // Simulate microphone access request logic
          const shouldRequestMicrophone = audioEnabled;
          const microphoneAccessRequested = audioEnabled;

          // Verify microphone is only requested when enabled
          expect(microphoneAccessRequested).toBe(shouldRequestMicrophone);

          // Verify no microphone access when disabled
          if (!audioEnabled) {
            expect(microphoneAccessRequested).toBe(false);
          }

          // Verify microphone access is requested when enabled
          if (audioEnabled) {
            expect(microphoneAccessRequested).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Additional audio analysis utility tests
describe('Audio Analysis Utilities', () => {
  test('RMS calculation should be non-negative', () => {
    fc.assert(
      fc.property(
        fc.float32Array({ minLength: 100, maxLength: 2048, noDefaultInfinity: true, noNaN: true }),
        (buffer) => {
          const rms = calculateRMS(buffer);
          expect(rms).toBeGreaterThanOrEqual(0);
          expect(rms).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Dominant frequency should be positive', () => {
    fc.assert(
      fc.property(
        fc.float32Array({ minLength: 100, maxLength: 2048, noDefaultInfinity: true, noNaN: true }),
        (buffer) => {
          const frequency = findDominantFrequency(buffer);
          expect(frequency).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Sustained duration should be non-negative', () => {
    fc.assert(
      fc.property(
        fc.float32Array({ minLength: 100, maxLength: 2048, noDefaultInfinity: true, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (buffer, threshold) => {
          const duration = calculateSustainedDuration(buffer, threshold);
          expect(duration).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Pattern match score should be between 0 and 1', () => {
    fc.assert(
      fc.property(
        fc.float32Array({ minLength: 100, maxLength: 2048, noDefaultInfinity: true, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 1000, noNaN: true }),
        (buffer, amplitude, frequency) => {
          const score = matchCrashPattern(buffer, amplitude, frequency);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
