import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Driver } from '../../contexts/FleetContext';
import { getRiskLevel, getRiskColor, getRiskLabel, getRiskRankHistory, type RiskRankHistory } from '../../utils/riskCalculation';
import { cn } from '../../utils/utils';

interface RiskRankingPanelProps {
  drivers: Driver[];
}

export function RiskRankingPanel({ drivers }: RiskRankingPanelProps) {
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);

  // Sort drivers by risk rank (highest first)
  const sortedDrivers = [...drivers]
    .filter(d => d.status === 'active')
    .sort((a, b) => b.riskRank - a.riskRank);

  const toggleExpanded = (driverId: string) => {
    setExpandedDriverId(expandedDriverId === driverId ? null : driverId);
  };

  const getRiskTrend = (history: RiskRankHistory[]): 'up' | 'down' | 'stable' => {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-7); // Last 7 days
    if (recent.length < 2) return 'stable';
    
    const oldAvg = recent.slice(0, Math.floor(recent.length / 2))
      .reduce((sum, h) => sum + h.riskRank, 0) / Math.floor(recent.length / 2);
    const newAvg = recent.slice(Math.floor(recent.length / 2))
      .reduce((sum, h) => sum + h.riskRank, 0) / Math.ceil(recent.length / 2);
    
    const diff = newAvg - oldAvg;
    if (Math.abs(diff) < 5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-white mb-1">Risk Rankings</h3>
          <p className="text-xs text-slate-500 font-medium">
            Drivers ranked by risk level (highest risk first)
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/50 rounded-lg border border-slate-800/50">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-400">
            {sortedDrivers.filter(d => getRiskLevel(d.riskRank) === 'high').length} High Risk
          </span>
        </div>
      </div>

      {sortedDrivers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-400 text-sm">No active drivers to rank</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDrivers.map((driver, index) => {
            const history = getRiskRankHistory(driver.id);
            const trend = getRiskTrend(history);
            const isExpanded = expandedDriverId === driver.id;

            return (
              <div key={driver.id} className="space-y-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all",
                    getRiskColor(driver.riskRank),
                    isExpanded && "ring-2 ring-offset-2 ring-offset-slate-950"
                  )}
                  onClick={() => toggleExpanded(driver.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Rank Badge */}
                      <div className="w-8 h-8 rounded-lg bg-slate-950/50 flex items-center justify-center">
                        <span className="text-sm font-black text-white">#{index + 1}</span>
                      </div>

                      {/* Driver Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-white">{driver.name}</span>
                          {trend !== 'stable' && (
                            <div className="flex items-center gap-1">
                              {trend === 'up' ? (
                                <TrendingUp className="w-3 h-3 text-red-400" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-emerald-400" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                          <span>{getRiskLabel(driver.riskRank)}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-500">Score: {driver.safetyScore}</span>
                        </div>
                      </div>

                      {/* Risk Rank Value */}
                      <div className="text-right">
                        <div className="text-2xl font-black">{driver.riskRank}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Risk Points
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <div className="ml-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Expanded History */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 ml-11">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                          Risk History (Last 30 Days)
                        </h4>
                        
                        {history.length === 0 ? (
                          <p className="text-xs text-slate-500">No historical data available</p>
                        ) : (
                          <div className="space-y-2">
                            {history.slice(-30).reverse().slice(0, 10).map((entry, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-slate-400 font-medium">
                                  {new Date(entry.date).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-500">
                                    Score: {entry.safetyScore}
                                  </span>
                                  <span className="text-slate-500">
                                    Crashes: {entry.crashEvents}
                                  </span>
                                  <span className={cn(
                                    "font-black",
                                    entry.riskRank < 20 ? "text-emerald-400" :
                                    entry.riskRank < 50 ? "text-amber-400" :
                                    "text-red-400"
                                  )}>
                                    Risk: {entry.riskRank}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
