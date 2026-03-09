/**
 * Multi-factor crash detection system
 * Checks 8 different indicators to reduce false alarms
 * SOS triggers only if 5+ indicators are positive
 */

export interface CrashIndicators {
  highGForce: boolean;           // 1. G-force > 4.0
  suddenDeceleration: boolean;   // 2. Speed dropped rapidly
  audioDetection: boolean;       // 3. Crash sound detected
  airbagDeployment: boolean;     // 4. Airbag sensor (if available)
  vehicleTilt: boolean;          // 5. Abnormal tilt angle
  impactVibration: boolean;      // 6. High-frequency vibration
  speedToZero: boolean;          // 7. Speed went to 0 suddenly
  noMovement: boolean;           // 8. No movement for 5+ seconds after impact
  rapidRotation: boolean;        // 9. Gyroscope detects rapid rotation (rollover)
  sustainedImpact: boolean;      // 10. Multiple impacts in short time
}

export interface CrashDetectionResult {
  isCrash: boolean;
  confidence: number; // 0-100%
  triggeredIndicators: string[];
  indicatorCount: number;
  threshold: number;
}

const INDICATOR_NAMES: Record<keyof CrashIndicators, string> = {
  highGForce: 'High G-Force (>4.0)',
  suddenDeceleration: 'Sudden Deceleration',
  audioDetection: 'Crash Sound Detected',
  airbagDeployment: 'Airbag Deployment',
  vehicleTilt: 'Abnormal Vehicle Tilt',
  impactVibration: 'High Impact Vibration',
  speedToZero: 'Speed Dropped to Zero',
  noMovement: 'No Movement After Impact',
  rapidRotation: 'Rapid Rotation/Rollover',
  sustainedImpact: 'Multiple Impacts Detected'
};

const CRASH_THRESHOLD = 5; // Need 5 out of 10 indicators

/**
 * Analyze crash indicators and determine if SOS should be triggered
 */
export function analyzeCrashIndicators(indicators: CrashIndicators): CrashDetectionResult {
  const triggeredIndicators: string[] = [];
  let count = 0;

  // Count positive indicators
  Object.entries(indicators).forEach(([key, value]) => {
    if (value) {
      count++;
      triggeredIndicators.push(INDICATOR_NAMES[key as keyof CrashIndicators]);
    }
  });

  const confidence = Math.round((count / 10) * 100);
  const isCrash = count >= CRASH_THRESHOLD;

  return {
    isCrash,
    confidence,
    triggeredIndicators,
    indicatorCount: count,
    threshold: CRASH_THRESHOLD
  };
}

/**
 * Check for sudden deceleration
 */
export function checkSuddenDeceleration(
  currentSpeed: number,
  previousSpeed: number,
  timeDelta: number // in seconds
): boolean {
  if (timeDelta === 0) return false;
  
  // Calculate deceleration in m/s²
  const speedChange = (previousSpeed - currentSpeed) * (1000 / 3600); // Convert km/h to m/s
  const deceleration = speedChange / timeDelta;
  
  // Threshold: 8 m/s² (about 0.8g) - typical hard braking
  // Crash would be much higher (20+ m/s²)
  return deceleration > 20;
}

/**
 * Check if speed went to zero suddenly
 */
export function checkSpeedToZero(
  currentSpeed: number,
  previousSpeed: number,
  timeDelta: number
): boolean {
  // Speed was significant (>20 km/h) and now is near zero (<5 km/h)
  // within short time (<2 seconds)
  return previousSpeed > 20 && currentSpeed < 5 && timeDelta < 2;
}

/**
 * Check for abnormal vehicle tilt
 */
export function checkVehicleTilt(
  accelerationX: number,
  accelerationY: number,
  accelerationZ: number
): boolean {
  // Calculate tilt angle from accelerometer
  // Normal: Z-axis should be ~9.81 m/s² (gravity)
  // Abnormal: Significant X or Y component indicates tilt/rollover
  
  const tiltX = Math.abs(accelerationX);
  const tiltY = Math.abs(accelerationY);
  
  // Threshold: >5 m/s² on X or Y axis indicates significant tilt
  return tiltX > 5 || tiltY > 5;
}

/**
 * Check for high-frequency impact vibration
 */
export function checkImpactVibration(
  accelerationHistory: number[],
  windowSize: number = 10
): boolean {
  if (accelerationHistory.length < windowSize) return false;
  
  // Get recent acceleration values
  const recent = accelerationHistory.slice(-windowSize);
  
  // Calculate variance (high variance = vibration)
  const mean = recent.reduce((sum, val) => sum + val, 0) / windowSize;
  const variance = recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowSize;
  
  // High variance (>50) indicates impact vibration
  return variance > 50;
}

/**
 * Check for no movement after potential impact
 */
export function checkNoMovement(
  speed: number,
  accelerationMagnitude: number,
  durationSeconds: number
): boolean {
  // Speed near zero (<2 km/h) and minimal acceleration (<1 m/s²)
  // for extended period (>5 seconds)
  return speed < 2 && accelerationMagnitude < 1 && durationSeconds > 5;
}

/**
 * Check for rapid rotation (rollover detection)
 */
export function checkRapidRotation(
  rotationRateAlpha: number,
  rotationRateBeta: number,
  rotationRateGamma: number
): boolean {
  // Calculate total rotation rate
  const totalRotation = Math.sqrt(
    rotationRateAlpha * rotationRateAlpha +
    rotationRateBeta * rotationRateBeta +
    rotationRateGamma * rotationRateGamma
  );
  
  // Threshold: >200 degrees/second indicates rollover
  return totalRotation > 200;
}

/**
 * Check for sustained impact (multiple impacts in short time)
 */
export function checkSustainedImpact(
  gForceHistory: number[],
  windowSize: number = 10
): boolean {
  if (gForceHistory.length < windowSize) return false;
  
  // Get recent G-force values
  const recent = gForceHistory.slice(-windowSize);
  
  // Count how many readings exceed 3.0g
  const highGForceCount = recent.filter(g => g > 3.0).length;
  
  // If 5+ readings in last 10 show high G-force, it's sustained impact
  return highGForceCount >= 5;
}

/**
 * Create crash detection state tracker
 */
export class CrashDetectionTracker {
  private speedHistory: { speed: number; timestamp: number }[] = [];
  private accelerationHistory: number[] = [];
  private gForceHistory: number[] = [];
  private lastImpactTime: number = 0;
  private noMovementStartTime: number = 0;
  
  private readonly MAX_HISTORY_SIZE = 50;
  private readonly HISTORY_DURATION_MS = 10000; // 10 seconds

  /**
   * Update speed history
   */
  updateSpeed(speed: number): void {
    const now = Date.now();
    this.speedHistory.push({ speed, timestamp: now });
    
    // Keep only recent history
    this.speedHistory = this.speedHistory.filter(
      entry => now - entry.timestamp < this.HISTORY_DURATION_MS
    );
    
    if (this.speedHistory.length > this.MAX_HISTORY_SIZE) {
      this.speedHistory.shift();
    }
  }

  /**
   * Update acceleration history
   */
  updateAcceleration(magnitude: number): void {
    this.accelerationHistory.push(magnitude);
    
    if (this.accelerationHistory.length > this.MAX_HISTORY_SIZE) {
      this.accelerationHistory.shift();
    }
  }

  /**
   * Update G-force history
   */
  updateGForce(gForce: number): void {
    this.gForceHistory.push(gForce);
    
    if (this.gForceHistory.length > this.MAX_HISTORY_SIZE) {
      this.gForceHistory.shift();
    }
  }

  /**
   * Get previous speed for comparison
   */
  getPreviousSpeed(secondsAgo: number = 1): number {
    const targetTime = Date.now() - (secondsAgo * 1000);
    
    // Find closest speed entry
    const closest = this.speedHistory.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - targetTime) < Math.abs(prev.timestamp - targetTime)
        ? curr
        : prev;
    }, this.speedHistory[0]);
    
    return closest?.speed || 0;
  }

  /**
   * Get acceleration history for vibration analysis
   */
  getAccelerationHistory(): number[] {
    return [...this.accelerationHistory];
  }

  /**
   * Get G-force history for sustained impact analysis
   */
  getGForceHistory(): number[] {
    return [...this.gForceHistory];
  }

  /**
   * Track no movement duration
   */
  updateNoMovementTracking(speed: number, accelerationMagnitude: number): number {
    const isStationary = speed < 2 && accelerationMagnitude < 1;
    
    if (isStationary) {
      if (this.noMovementStartTime === 0) {
        this.noMovementStartTime = Date.now();
      }
      return (Date.now() - this.noMovementStartTime) / 1000; // seconds
    } else {
      this.noMovementStartTime = 0;
      return 0;
    }
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.speedHistory = [];
    this.accelerationHistory = [];
    this.gForceHistory = [];
    this.lastImpactTime = 0;
    this.noMovementStartTime = 0;
  }
}
