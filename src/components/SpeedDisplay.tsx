import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import { cn } from '../utils/utils';

interface SpeedDisplayProps {
  speed: number;
  limit: number;
  zone: string;
}

export function SpeedDisplay({ speed, limit, zone }: SpeedDisplayProps) {
  const isOverspeed = speed > limit;
  const isNearLimit = speed > limit * 0.9 && speed <= limit;

  const colorClass = isOverspeed
    ? 'text-red-500'
    : isNearLimit
    ? 'text-amber-400'
    : 'text-emerald-500';

  return (
    <div className="relative flex flex-col items-center justify-center py-2 md:py-4">
      {/* Glowing Ring - more subtle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-current blur-sm",
            colorClass
          )}
        />
      </div>

      <div className="relative z-10 text-center">
        <motion.div
          key={Math.floor(speed)}
          initial={{ scale: 0.95, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn("text-6xl sm:text-7xl md:text-[8rem] font-black tracking-tighter tabular-nums leading-none drop-shadow-2xl", colorClass)}
        >
          {Math.round(speed)}
        </motion.div>
        <div className="text-[8px] md:text-[10px] text-slate-500 font-black tracking-[0.3em] uppercase mt-0">KM/H</div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="bg-white rounded-lg p-0.5 border border-slate-800 shadow-xl">
          <div className="border-2 border-red-600 rounded-md px-1.5 py-0.5 flex flex-col items-center min-w-[32px]">
            <span className="text-[6px] font-black text-slate-900 leading-none">LIMIT</span>
            <span className="text-sm font-black text-slate-900 leading-none">{limit}</span>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-xl px-2.5 py-1 flex items-center gap-2">
          <MapPin className="w-2.5 h-2.5 text-blue-400" />
          <div className="text-[9px] text-white font-bold truncate max-w-[80px] md:max-w-none">{zone}</div>
        </div>
      </div>

      {isOverspeed && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-2 left-0 right-0 flex justify-center"
        >
          <div className="bg-red-500 text-white px-3 py-0.5 rounded-full text-[10px] font-bold animate-pulse shadow-lg shadow-red-500/20">
            REDUCE SPEED
          </div>
        </motion.div>
      )}
    </div>
  );
}
