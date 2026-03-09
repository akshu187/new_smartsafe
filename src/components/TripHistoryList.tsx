import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Trip } from '../types';
import { cn } from '../utils/utils';

interface TripHistoryListProps {
  trips: Trip[];
}

export function TripHistoryList({ trips }: TripHistoryListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Trips</h3>
        <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">View All</button>
      </div>
      <div className="space-y-2">
        {trips.map((trip) => (
          <motion.div
            key={trip.id}
            whileHover={{ x: 2 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between group cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-500 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors border border-slate-700/50">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white leading-tight">{trip.date}</div>
                <div className="flex items-center gap-2 sm:gap-3 mt-0.5">
                  <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-500 font-black">
                    <MapPin className="w-2.5 h-2.5 text-blue-500/50" />
                    {trip.distance} KM
                  </div>
                  <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-500 font-black">
                    <Clock className="w-2.5 h-2.5 text-emerald-500/50" />
                    {Math.floor(trip.duration / 60)}m
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                "px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black",
                trip.safetyScore > 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              )}>
                {trip.safetyScore}
              </div>
              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
