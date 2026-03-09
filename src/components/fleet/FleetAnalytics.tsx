import { useState } from 'react';
import { BarChart3, TrendingUp, Users, MapPin, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import type { FleetAnalytics as FleetAnalyticsType } from '../../contexts/FleetContext';
import { cn } from '../../utils/utils';

interface FleetAnalyticsProps {
  analytics: FleetAnalyticsType | null;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export function FleetAnalytics({ analytics, onDateRangeChange }: FleetAnalyticsProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const handleDateRangeChange = (range: '7d' | '30d' | '90d' | 'all') => {
    setDateRange(range);
    
    const end = new Date();
    let start = new Date();
    
    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'all':
        start = new Date(0); // Beginning of time
        break;
    }
    
    onDateRangeChange?.(start.toISOString(), end.toISOString());
  };

  if (!analytics) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
        <p className="text-slate-400 text-sm text-center">No analytics data available</p>
      </div>
    );
  }

  const metrics = [
    {
      icon: MapPin,
      label: 'Total Distance',
      value: `${analytics.totalDistance.toFixed(1)} km`,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: BarChart3,
      label: 'Total Trips',
      value: analytics.totalTrips.toString(),
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      icon: Users,
      label: 'Avg Safety Score',
      value: analytics.averageSafetyScore.toFixed(1),
      color: analytics.averageSafetyScore >= 90 ? 'text-emerald-500' : 
             analytics.averageSafetyScore >= 70 ? 'text-amber-500' : 'text-red-500',
      bg: analytics.averageSafetyScore >= 90 ? 'bg-emerald-500/10' : 
          analytics.averageSafetyScore >= 70 ? 'bg-amber-500/10' : 'bg-red-500/10'
    },
    {
      icon: AlertCircle,
      label: 'Crash Frequency',
      value: `${(analytics.crashEventFrequency * 100).toFixed(2)}%`,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white mb-1">Fleet Analytics</h3>
          <p className="text-xs text-slate-500 font-medium">
            Aggregated metrics across all active drivers
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-800/50 rounded-lg p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => handleDateRangeChange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  dateRange === range
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", metric.bg)}>
                <metric.icon className={cn("w-5 h-5", metric.color)} />
              </div>
            </div>
            
            <div className="text-3xl font-black text-white mb-1">
              {metric.value}
            </div>
            
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {metric.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h4 className="text-sm font-black text-white uppercase tracking-widest">
            Performance Summary
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Average Trip Distance
            </div>
            <div className="text-xl font-black text-white">
              {analytics.totalTrips > 0 
                ? (analytics.totalDistance / analytics.totalTrips).toFixed(1) 
                : '0.0'} km
            </div>
          </div>
          
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Safety Rating
            </div>
            <div className={cn(
              "text-xl font-black",
              analytics.averageSafetyScore >= 90 ? "text-emerald-500" :
              analytics.averageSafetyScore >= 70 ? "text-amber-500" :
              "text-red-500"
            )}>
              {analytics.averageSafetyScore >= 90 ? 'Excellent' :
               analytics.averageSafetyScore >= 70 ? 'Good' :
               'Needs Improvement'}
            </div>
          </div>
          
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Risk Status
            </div>
            <div className={cn(
              "text-xl font-black",
              analytics.crashEventFrequency < 0.01 ? "text-emerald-500" :
              analytics.crashEventFrequency < 0.05 ? "text-amber-500" :
              "text-red-500"
            )}>
              {analytics.crashEventFrequency < 0.01 ? 'Low' :
               analytics.crashEventFrequency < 0.05 ? 'Medium' :
               'High'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
