import type { SensitivityLevel } from '../hooks/useAudioDetection';

export interface AudioAnalysisResult {
  isCrash: boolean;
  amplitude: number;
  dominantFrequency: number;
  confidence: number;
  sustainedDuration: number;
}

export interface AudioThresholds {
  amplitude: number;
  frequency: { min: number; max: number };
  duration: number;
}

/**
 * Analyze audio buffer for crash patterns
 * @param audioBuffer - Float32Array of audio samples
 * @param thresholds - Detection thresholds based on sensitivity
 * @returns Analysis result with crash detection flag
 */
export function analyzeAudio(
  audioBuffer: Float32Array,
  thresholds: AudioThresholds
): AudioAnalysisResult {
  // 1. Calculate RMS amplitude
  const amplitude = calculateRMS(audioBuffer);

  // 2. Perform FFT analysis to find dominant frequency
  const dominantFrequency = findDominantFrequency(audioBuffer);

  // 3. Check frequency range (100-500 Hz for crash sounds)
  const isInFrequencyRange =
    dominantFrequency >= thresholds.frequency.min &&
    dominantFrequency <= thresholds.frequency.max;

  // 4. Check amplitude threshold
  const isAboveAmplitudeThreshold = amplitude >= thresholds.amplitude;

  // 5. Calculate sustained duration
  const sustainedDuration = calculateSustainedDuration(audioBuffer, thresholds.amplitude);

  // 6. Check duration threshold
  const meetsDurationThreshold = sustainedDuration >= thresholds.duration;

  // 7. Pattern matching for crash signature
  const matchScore = matchCrashPattern(audioBuffer, amplitude, dominantFrequency);

  // 8. Determine if crash detected
  const isCrash =
    isInFrequencyRange &&
    isAboveAmplitudeThreshold &&
    meetsDurationThreshold &&
    matchScore > 0.7; // 70% confidence threshold

  return {
    isCrash,
    amplitude,
    dominantFrequency,
    confidence: matchScore,
    sustainedDuration
  };
}

/**
 * Calculate Root Mean Square (RMS) amplitude
 * Represents the average power of the audio signal
 */
export function calculateRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sum / buffer.length);
  
  // Convert to decibels (dB)
  // Reference: 0 dB = 1.0 RMS
  const db = 20 * Math.log10(rms + 1e-10); // Add small value to avoid log(0)
  
  // Normalize to 0-100 range (typical audio is -60 to 0 dB)
  return Math.max(0, Math.min(100, (db + 60) * (100 / 60)));
}

/**
 * Find dominant frequency using simplified FFT approach
 * In production, this would use a proper FFT library or AnalyserNode.getByteFrequencyData
 */
export function findDominantFrequency(buffer: Float32Array): number {
  // Simplified frequency detection using zero-crossing rate
  // This is a basic approximation; real implementation would use FFT
  let zeroCrossings = 0;
  for (let i = 1; i < buffer.length; i++) {
    if ((buffer[i] >= 0 && buffer[i - 1] < 0) || (buffer[i] < 0 && buffer[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }

  // Estimate frequency from zero-crossing rate
  // Assuming 44.1kHz sample rate
  const sampleRate = 44100;
  const frequency = (zeroCrossings * sampleRate) / (2 * buffer.length);

  return frequency;
}

/**
 * Calculate how long the audio stays above the amplitude threshold
 */
export function calculateSustainedDuration(buffer: Float32Array, threshold: number): number {
  const sampleRate = 44100; // Standard audio sample rate
  let maxSustainedSamples = 0;
  let currentSustainedSamples = 0;

  for (let i = 0; i < buffer.length; i++) {
    const amplitude = Math.abs(buffer[i]) * 100; // Normalize to 0-100
    
    if (amplitude >= threshold) {
      currentSustainedSamples++;
      maxSustainedSamples = Math.max(maxSustainedSamples, currentSustainedSamples);
    } else {
      currentSustainedSamples = 0;
    }
  }

  // Convert samples to milliseconds
  return (maxSustainedSamples / sampleRate) * 1000;
}

/**
 * Match audio pattern against crash signature
 * Crash sounds typically have:
 * - Sudden onset (sharp attack)
 * - High amplitude
 * - Broadband frequency content
 * - Sustained duration
 */
export function matchCrashPattern(
  buffer: Float32Array,
  amplitude: number,
  dominantFrequency: number
): number {
  let score = 0;

  // 1. Check for sudden onset (sharp attack)
  const hasSharpAttack = detectSharpAttack(buffer);
  if (hasSharpAttack) score += 0.3;

  // 2. Check amplitude (crashes are loud)
  if (amplitude > 70) score += 0.3;
  else if (amplitude > 60) score += 0.2;

  // 3. Check frequency range (crashes have mid-range frequencies)
  if (dominantFrequency >= 100 && dominantFrequency <= 500) score += 0.2;

  // 4. Check for broadband content (crashes have multiple frequencies)
  const hasBroadbandContent = detectBroadbandContent(buffer);
  if (hasBroadbandContent) score += 0.2;

  return Math.min(1.0, score);
}

/**
 * Detect sharp attack (sudden increase in amplitude)
 */
function detectSharpAttack(buffer: Float32Array): boolean {
  const windowSize = Math.floor(buffer.length * 0.1); // First 10% of buffer
  
  let maxIncrease = 0;
  for (let i = 1; i < windowSize; i++) {
    const increase = Math.abs(buffer[i]) - Math.abs(buffer[i - 1]);
    maxIncrease = Math.max(maxIncrease, increase);
  }

  // Sharp attack if amplitude increases by more than 0.3 in a single sample
  return maxIncrease > 0.3;
}

/**
 * Detect broadband frequency content
 * Crashes have energy across multiple frequency bands
 */
function detectBroadbandContent(buffer: Float32Array): boolean {
  // Simplified check: high variance in signal indicates broadband content
  const mean = buffer.reduce((sum, val) => sum + val, 0) / buffer.length;
  const variance = buffer.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / buffer.length;
  
  // High variance suggests broadband content
  return variance > 0.1;
}

/**
 * Get sensitivity thresholds
 */
export function getSensitivityThresholds(sensitivity: SensitivityLevel): AudioThresholds {
  const configs = {
    low: {
      amplitude: 85,
      frequency: { min: 100, max: 500 },
      duration: 500
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

  return configs[sensitivity];
}
