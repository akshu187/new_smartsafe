import { motion } from 'motion/react';
import { Gauge } from 'lucide-react';

export interface SpeedOverlayProps {
  speed: number; // Speed in km/h
  speedLimit?: number; // Speed limit in km/h
  unit: 'mph' | 'km/h';
  className?: string;
}

export function SpeedOverlay({ 
  speed, 
  speedLimit, 
  unit = 'km/h',
  className = '' 
}: SpeedOverlayProps) {
  // Convert speed to selected unit
  const displaySpeed = convertSpeed(speed, unit);
  const displaySpeedLimit = speedLimit ? convertSpeed(speedLimit, unit) : undefined;
  
  // Determine if speeding
  const isSpeeding = speedLimit !== undefined && speed > speedLimit;
  
  // Determine color based on speed
  const speedColor = isSpeeding 
    ? 'text-red-500' 
    : 'text-green-500';
  
  const bgColor = isSpeeding
    ? 'bg-red-500/10 border-red-500/30'
    : 'bg-slate-900/60 border-slate-800/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-4 right-4 ${bgColor} backdrop-blur-xl border rounded-2xl p-4 ${className}`}
      style={{ zIndex: 1000 }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${isSpeeding ? 'bg-red-500/20' : 'bg-slate-800/50'} flex items-center justify-center`}>
          <Gauge className={`w-5 h-5 ${speedColor}`} />
        </div>
        
        <div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${speedColor}`}>
              {Math.round(displaySpeed)}
            </span>
            <span className="text-sm text-slate-400">{unit}</span>
          </div>
          
          {displaySpeedLimit !== undefined && (
            <div className="text-xs text-slate-400">
              Limit: {Math.round(displaySpeedLimit)} {unit}
            </div>
          )}
          
          {isSpeeding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-500 font-medium mt-1"
            >
              Speeding!
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Convert speed from km/h to the specified unit
 */
export function convertSpeed(speedKmh: number, unit: 'mph' | 'km/h'): number {
  if (unit === 'mph') {
    return speedKmh * 0.621371;
  }
  return speedKmh;
}
