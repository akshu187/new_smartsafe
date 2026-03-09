import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { DriverCard } from './DriverCard';
import type { Driver } from '../../contexts/FleetContext';

interface DriverListProps {
  drivers: Driver[];
  onDriverClick?: (driver: Driver) => void;
}

type SortField = 'name' | 'safetyScore' | 'riskRank' | 'trips' | 'distance';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'invited' | 'inactive';

export function DriverList({ drivers, onDriverClick }: DriverListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('riskRank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter and sort drivers
  const filteredAndSortedDrivers = useMemo(() => {
    let result = [...drivers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        driver =>
          driver.name.toLowerCase().includes(query) ||
          driver.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(driver => driver.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'safetyScore':
          aValue = a.safetyScore;
          bValue = b.safetyScore;
          break;
        case 'riskRank':
          aValue = a.riskRank;
          bValue = b.riskRank;
          break;
        case 'trips':
          aValue = a.trips.length;
          bValue = b.trips.length;
          break;
        case 'distance':
          aValue = a.trips.reduce((sum, trip) => sum + trip.distance, 0);
          bValue = b.trips.reduce((sum, trip) => sum + trip.distance, 0);
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

    return result;
  }, [drivers, searchQuery, filterStatus, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search drivers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-800/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="bg-slate-900/40 border border-slate-800/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-500" />
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="bg-slate-900/40 border border-slate-800/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="riskRank">Risk Rank</option>
            <option value="safetyScore">Safety Score</option>
            <option value="name">Name</option>
            <option value="trips">Trip Count</option>
            <option value="distance">Distance</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-3 bg-slate-900/40 border border-slate-800/50 rounded-xl text-xs font-bold text-white hover:bg-slate-800 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400 font-medium">
          Showing {filteredAndSortedDrivers.length} of {drivers.length} drivers
        </p>
      </div>

      {/* Driver Grid */}
      {filteredAndSortedDrivers.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-black text-white mb-2">No drivers found</h3>
          <p className="text-slate-400 text-sm">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add drivers to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onClick={() => onDriverClick?.(driver)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
