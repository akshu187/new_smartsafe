import { motion } from 'motion/react';
import { Play, Square, Timer, MapPin } from 'lucide-react';
import { formatDuration } from '../utils/utils';

interface TripControlPanelProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  duration: number;
  distance: number;
}

export function TripControlPanel({ isActive, onStart, onStop, duration, distance }: TripControlPanelProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3.5 md:p-4 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Timer className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-[7px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Duration</div>
            <div className="text-base md:text-lg font-mono font-black text-white leading-none">{formatDuration(duration)}</div>
          </div>
        </div>
        <div className="h-7 w-[1px] bg-slate-800/50" />
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <MapPin className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-[7px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Distance</div>
            <div className="text-base md:text-lg font-mono font-black text-white leading-none">
              {distance.toFixed(2)} <span className="text-[9px] font-sans text-slate-500">KM</span>
            </div>
          </div>
        </div>
      </div>

      {!isActive ? (
        <button
          onClick={onStart}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-2xl text-white font-black text-sm shadow-xl shadow-blue-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group tracking-widest uppercase"
        >
          <Play className="fill-current w-4 h-4 group-hover:scale-110 transition-transform" />
          Start Trip
        </button>
      ) : (
        <button
          onClick={onStop}
          className="w-full py-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-2xl text-white font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 group tracking-widest uppercase"
        >
          <Square className="fill-current w-4 h-4 group-hover:scale-110 transition-transform" />
          Stop Trip
        </button>
      )}
    </div>
  );
}
