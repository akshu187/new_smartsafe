import { X, User, Shield, TrendingUp, MapPin, AlertCircle, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Driver } from '../../contexts/FleetContext';
import { getRiskLabel, getRiskColor, getRiskRankHistory } from '../../utils/riskCalculation';
import { cn } from '../../utils/utils';

interface DriverDetailModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DriverDetailModal({ driver, isOpen, onClose }: DriverDetailModalProps) {
  if (!driver) return null;

  const history = getRiskRankHistory(driver.id);
  const totalDistance = driver.trips.reduce((sum, trip) => sum + trip.distance, 0);
  const totalDuration = driver.trips.reduce((sum, trip) => sum + trip.duration, 0);
  const avgTripDistance = driver.trips.length > 0 ? totalDistance / driver.trips.length : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] bg-slate-900 border border-slate-800/50 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center">
                  <User className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{driver.name}</h2>
                  <p className="text-sm text-slate-400 font-medium">{driver.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Safety Score
                    </span>
                  </div>
                  <div className={cn(
                    "text-3xl font-black",
                    driver.safetyScore >= 90 ? "text-emerald-500" :
                    driver.safetyScore >= 70 ? "text-amber-500" :
                    "text-red-500"
                  )}>
                    {driver.safetyScore}
                  </div>
                </div>

                <div className={cn("p-4 rounded-xl border", getRiskColor(driver.riskRank))}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Risk Level
                    </span>
                  </div>
                  <div className="text-lg font-black">
                    {getRiskLabel(driver.riskRank)}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Total Distance
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {totalDistance.toFixed(0)} <span className="text-sm text-slate-500">km</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Total Trips
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {driver.trips.length}
                  </div>
                </div>
              </div>

              {/* Driving Pattern Analysis */}
              <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Driving Pattern Analysis
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Avg Trip Distance
                    </div>
                    <div className="text-xl font-black text-white">
                      {avgTripDistance.toFixed(1)} km
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Harsh Brakes
                    </div>
                    <div className="text-xl font-black text-amber-400">
                      {driver.stats.harshBrakes || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Harsh Accel
                    </div>
                    <div className="text-xl font-black text-amber-400">
                      {driver.stats.harshAcceleration || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Speeding Events
                    </div>
                    <div className="text-xl font-black text-red-400">
                      {driver.stats.overspeedCount || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Score Trends */}
              <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Safety Score Trends
                  </h3>
                </div>
                
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400">No historical data available</p>
                ) : (
                  <div className="space-y-2">
                    {history.slice(-10).reverse().map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                      >
                        <span className="text-sm text-slate-400 font-medium">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "text-sm font-black",
                            entry.safetyScore >= 90 ? "text-emerald-400" :
                            entry.safetyScore >= 70 ? "text-amber-400" :
                            "text-red-400"
                          )}>
                            Score: {entry.safetyScore}
                          </span>
                          <span className={cn(
                            "text-sm font-black",
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

              {/* Trip History */}
              <div className="bg-slate-950/50 rounded-xl border border-slate-800/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Recent Trip History
                  </h3>
                </div>
                
                {driver.trips.length === 0 ? (
                  <p className="text-sm text-slate-400">No trips recorded</p>
                ) : (
                  <div className="space-y-2">
                    {driver.trips.slice(-10).reverse().map((trip) => (
                      <div
                        key={trip.id}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-bold text-white">{trip.date}</div>
                          <div className="text-xs text-slate-500">
                            {Math.floor(trip.duration / 60)} min • {trip.distance.toFixed(1)} km
                          </div>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-lg text-xs font-black",
                          trip.safetyScore >= 90 ? "bg-emerald-500/10 text-emerald-400" :
                          trip.safetyScore >= 70 ? "bg-amber-500/10 text-amber-400" :
                          "bg-red-500/10 text-red-400"
                        )}>
                          Score: {trip.safetyScore}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Crash Events */}
              <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-black text-red-400 uppercase tracking-widest">
                    Crash Events
                  </h3>
                </div>
                
                <div className="text-3xl font-black text-red-400 mb-2">
                  {driver.stats.harshBrakes || 0}
                </div>
                <p className="text-xs text-slate-400">
                  Total crash events detected across all trips
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
