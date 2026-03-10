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
  className = 'absolute bottom-3 right-3 z-[999]' 
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
      className={`${bgColor} backdrop-blur-xl border rounded-xl p-2.5 sm:rounded-2xl sm:p-4 ${className}`}
      style={{ zIndex: 1000 }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${isSpeeding ? 'bg-red-500/20' : 'bg-slate-800/50'} flex items-center justify-center`}>
          <Gauge className={`w-4 h-4 sm:w-5 sm:h-5 ${speedColor}`} />
        </div>
        
        <div>
          <div className="flex items-baseline gap-1">
            <span className={`text-lg sm:text-2xl font-bold leading-none ${speedColor}`}>
              {Math.round(displaySpeed)}
            </span>
            <span className="text-xs sm:text-sm text-slate-400">{unit}</span>
          </div>
          
          {displaySpeedLimit !== undefined && (
            <div className="text-[10px] sm:text-xs text-slate-400">
              Limit: {Math.round(displaySpeedLimit)} {unit}
            </div>
          )}
          
          {isSpeeding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] sm:text-xs text-red-500 font-medium mt-0.5 sm:mt-1"
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
