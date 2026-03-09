import { motion } from 'motion/react';
import { useState } from 'react';
import { Users, ArrowLeft, RefreshCw } from 'lucide-react';
import { useFleetData } from '../../hooks/useFleetData';
import { getFleetAccessError } from '../../utils/auth';
import { AuthorizationError } from '../AuthorizationError';
import { DriverList } from './DriverList';
import { FleetAnalytics } from './FleetAnalytics';
import { RiskRankingPanel } from './RiskRankingPanel';
import { DriverDetailModal } from './DriverDetailModal';
import type { User } from '../../types';
import type { Driver } from '../../contexts/FleetContext';

interface FleetDashboardProps {
  currentUser: User | null;
  onNavigateBack: () => void;
}

export function FleetDashboard({ currentUser, onNavigateBack }: FleetDashboardProps) {
  const { fleet, analytics, isLoading, isSyncing, lastSyncTime, syncError, manualSync } = useFleetData();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Check authorization
  const authError = getFleetAccessError(currentUser);
  if (authError) {
    return <AuthorizationError message={authError.message} onBack={onNavigateBack} />;
  }

  const formatSyncTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    // This would trigger analytics recalculation in the FleetContext
    console.log('Date range changed:', startDate, endDate);
    // TODO: Implement analytics recalculation with date range
  };

  const handleDriverClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 text-slate-200"
    >
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onNavigateBack}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white">
                    {fleet?.name || 'Fleet Dashboard'}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    {fleet?.drivers.length || 0} drivers
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sync Status */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Last Sync
                  </span>
                  <span className="text-xs font-black text-white">
                    {formatSyncTime(lastSyncTime)}
                  </span>
                </div>
                
                <button
                  onClick={manualSync}
                  disabled={isSyncing}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Admin Badge */}
              <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Sync Error */}
          {syncError && (
            <div className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs font-medium text-amber-400">
                ⚠️ {syncError} - Retrying in 30 seconds...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Analytics Section */}
        <FleetAnalytics 
          analytics={analytics} 
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Risk Rankings and Driver List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Rankings - 1 column */}
          <div className="lg:col-span-1">
            {fleet && <RiskRankingPanel drivers={fleet.drivers} />}
          </div>

          {/* Driver List - 2 columns */}
          <div className="lg:col-span-2">
            {fleet && fleet.drivers.length > 0 ? (
              <DriverList
                drivers={fleet.drivers}
                onDriverClick={handleDriverClick}
              />
            ) : (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h2 className="text-2xl font-black text-white mb-2">
                  No Drivers Yet
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Add drivers to your fleet to start monitoring their safety performance
                </p>
                <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-colors">
                  Add Driver
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Driver Detail Modal */}
        <DriverDetailModal
          driver={selectedDriver}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </motion.div>
  );
}
