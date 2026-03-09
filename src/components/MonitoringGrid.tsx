import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '../utils/utils';

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'emerald' | 'amber' | 'red' | 'cyan' | 'blue';
  progress?: number;
}

function StatsCard({ title, value, subtitle, icon, color, progress }: CardProps) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    red: 'text-red-400 bg-red-400/10 border-red-400/20',
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xl"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={cn("p-1.5 sm:p-2 rounded-xl border", colorMap[color])}>
          {icon}
        </div>
        {progress !== undefined && (
          <div className="relative w-8 h-8 sm:w-10 sm:h-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-800" />
              <motion.circle
                cx="20"
                cy="20"
                r="18"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={113}
                initial={{ strokeDashoffset: 113 }}
                animate={{ strokeDashoffset: 113 - (113 * progress) / 100 }}
                className={cn(colorMap[color].split(' ')[0])}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[8px] font-black text-white">
              {progress}%
            </div>
          </div>
        )}
      </div>
      <div>
        <div className="text-[7px] sm:text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">{title}</div>
        <div className="text-base sm:text-lg font-black text-white leading-tight">{value}</div>
        {subtitle && <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-medium">{subtitle}</div>}
      </div>
    </motion.div>
  );
}

export function MonitoringGrid({ score, harshEvents, fatigueTime, gForce }: any) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard
        title="Safety Score"
        value={score}
        subtitle="Excellent driving"
        icon={<Shield className="w-4 h-4" />}
        color={score > 80 ? 'emerald' : score > 50 ? 'amber' : 'red'}
        progress={score}
      />
      <StatsCard
        title="Harsh Events"
        value={harshEvents}
        subtitle="Brakes & Accel"
        icon={<Zap className="w-4 h-4" />}
        color={harshEvents === 0 ? 'emerald' : harshEvents < 3 ? 'amber' : 'red'}
      />
      <StatsCard
        title="Fatigue Monitor"
        value={`${Math.floor(fatigueTime / 60)}h ${fatigueTime % 60}m`}
        subtitle={fatigueTime > 120 ? "Take a break" : "Fresh"}
        icon={<AlertTriangle className="w-4 h-4" />}
        color={fatigueTime < 120 ? 'emerald' : fatigueTime < 240 ? 'amber' : 'red'}
      />
      <StatsCard
        title="Crash Monitor"
        value={`${gForce.toFixed(2)}G`}
        subtitle="Live G-Force"
        icon={<Activity className="w-4 h-4" />}
        color={gForce < 2.0 ? 'cyan' : gForce < 4.0 ? 'amber' : 'red'}
      />
    </div>
  );
}
