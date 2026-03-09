import type { Driver } from '../contexts/FleetContext';

/**
 * Risk calculation weights as specified in design document
 */
const RISK_WEIGHTS = {
  safetyScore: 0.4,
  crashEvents: 0.3,
  harshDriving: 0.2,
  fatigue: 0.1
} as const;

/**
 * Risk rank thresholds for categorization
 */
export const RISK_THRESHOLDS = {
  low: 20,
  medium: 50
} as const;

export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Historical risk rank data point
 */
export interface RiskRankHistory {
  date: string;
  riskRank: number;
  safetyScore: number;
  crashEvents: number;
}

/**
 * Calculate risk rank for a driver based on multiple factors
 * 
 * Formula:
 * Risk Rank = (100 - safetyScore) × 0.4 + crashEvents × 10 × 0.3 + harshEvents × 2 × 0.2 + fatigueViolations × 5 × 0.1
 * 
 * @param driver - Driver object with stats
 * @returns Calculated risk rank (0-100+)
 */
export function calculateRiskRank(driver: Driver): number {
  const safetyComponent = (100 - driver.safetyScore) * RISK_WEIGHTS.safetyScore;
  
  // Count crash events from stats (using harshBrakes as proxy for crashes in current implementation)
  const crashEvents = driver.stats.harshBrakes || 0;
  const crashComponent = crashEvents * 10 * RISK_WEIGHTS.crashEvents;
  
  // Harsh driving events (harsh brakes + harsh acceleration)
  const harshEvents = (driver.stats.harshBrakes || 0) + (driver.stats.harshAcceleration || 0);
  const harshComponent = harshEvents * 2 * RISK_WEIGHTS.harshDriving;
  
  // Fatigue violations (using overspeed count as proxy in current implementation)
  const fatigueViolations = driver.stats.overspeedCount || 0;
  const fatigueComponent = fatigueViolations * 5 * RISK_WEIGHTS.fatigue;
  
  const totalRisk = safetyComponent + crashComponent + harshComponent + fatigueComponent;
  
  return Math.round(totalRisk);
}

/**
 * Get risk level category based on risk rank value
 */
export function getRiskLevel(riskRank: number): RiskLevel {
  if (riskRank < RISK_THRESHOLDS.low) return 'low';
  if (riskRank < RISK_THRESHOLDS.medium) return 'medium';
  return 'high';
}

/**
 * Get color class for risk level
 */
export function getRiskColor(riskRank: number): string {
  const level = getRiskLevel(riskRank);
  switch (level) {
    case 'low':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'medium':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'high':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
  }
}

/**
 * Get label for risk level
 */
export function getRiskLabel(riskRank: number): string {
  const level = getRiskLevel(riskRank);
  switch (level) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
  }
}

/**
 * Check if risk rank change is significant (>20 points)
 */
export function isSignificantRiskChange(oldRank: number, newRank: number): boolean {
  return Math.abs(newRank - oldRank) > 20;
}

/**
 * Store historical risk rank data
 */
export function saveRiskRankHistory(driverId: string, history: RiskRankHistory): void {
  try {
    const storageKey = `smartsafe_risk_history_${driverId}`;
    const existingData = localStorage.getItem(storageKey);
    const historyArray: RiskRankHistory[] = existingData ? JSON.parse(existingData) : [];
    
    // Add new entry
    historyArray.push(history);
    
    // Keep only last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const filteredHistory = historyArray.filter(
      entry => new Date(entry.date) >= ninetyDaysAgo
    );
    
    localStorage.setItem(storageKey, JSON.stringify(filteredHistory));
  } catch (err) {
    console.error('Failed to save risk rank history:', err);
  }
}

/**
 * Get historical risk rank data for a driver
 */
export function getRiskRankHistory(driverId: string): RiskRankHistory[] {
  try {
    const storageKey = `smartsafe_risk_history_${driverId}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load risk rank history:', err);
    return [];
  }
}

/**
 * Update risk ranks for all drivers (should be called daily)
 */
export function updateDailyRiskRanks(drivers: Driver[]): Driver[] {
  const today = new Date().toISOString().split('T')[0];
  
  return drivers.map(driver => {
    const newRiskRank = calculateRiskRank(driver);
    const oldRiskRank = driver.riskRank;
    
    // Save to history
    saveRiskRankHistory(driver.id, {
      date: today,
      riskRank: newRiskRank,
      safetyScore: driver.safetyScore,
      crashEvents: driver.stats.harshBrakes || 0
    });
    
    // Check for significant change
    if (isSignificantRiskChange(oldRiskRank, newRiskRank)) {
      console.log(`Significant risk change for ${driver.name}: ${oldRiskRank} → ${newRiskRank}`);
      // TODO: Generate notification for administrator
    }
    
    return {
      ...driver,
      riskRank: newRiskRank
    };
  });
}
