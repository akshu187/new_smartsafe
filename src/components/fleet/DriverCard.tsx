import { User, Shield, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { Driver } from '../../contexts/FleetContext';
import { cn } from '../../utils/utils';

interface DriverCardProps {
  key?: string | number;
  driver: Driver;
  onClick?: () => void;
}

export function DriverCard({ driver, onClick }: DriverCardProps) {
  const getRiskColor = (riskRank: number) => {
    if (riskRank < 20) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (riskRank < 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const getRiskLabel = (riskRank: number) => {
    if (riskRank < 20) return 'Low Risk';
    if (riskRank < 50) return 'Medium Risk';
    return 'High Risk';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: Driver['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            Active
          </span>
        );
      case 'invited':
        return (
          <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-widest">
            Invited
          </span>
        );
      case 'inactive':
        return (
          <span className="px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Inactive
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 transition-all",
        onClick && "cursor-pointer hover:border-emerald-500/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">{driver.name}</h3>
            <p className="text-xs text-slate-500 font-medium">{driver.email}</p>
          </div>
        </div>
        {getStatusBadge(driver.status)}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Safety Score */}
        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Safety Score
            </span>
          </div>
          <div className={cn("text-2xl font-black", getScoreColor(driver.safetyScore))}>
            {driver.safetyScore}
          </div>
        </div>

        {/* Risk Rank */}
        <div className={cn("p-3 rounded-xl border", getRiskColor(driver.riskRank))}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Risk Level
            </span>
          </div>
          <div className="text-sm font-black">
            {getRiskLabel(driver.riskRank)}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/50">
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Trips
          </div>
          <div className="text-lg font-black text-white">
            {driver.trips.length}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Distance
          </div>
          <div className="text-lg font-black text-white">
            {driver.trips.reduce((sum, trip) => sum + trip.distance, 0).toFixed(0)} km
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Crashes
          </div>
          <div className="text-lg font-black text-red-400">
            {driver.stats.harshBrakes || 0}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
