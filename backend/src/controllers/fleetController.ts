import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Trip from '../models/Trip';
import CrashEvent from '../models/CrashEvent';
import { asyncHandler } from '../utils/errorHandler';
import { successResponse } from '../utils/response';

/**
 * @desc    Get all drivers (admin only)
 * @route   GET /api/fleet/drivers
 * @access  Private (Admin)
 */
export const getDrivers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const drivers = await User.find({ role: 'driver' }).select('-password -refreshToken');

    // Get trip stats for each driver
    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const trips = await Trip.find({ userId: driver._id });
        const crashEvents = await CrashEvent.find({ userId: driver._id });

        const totalTrips = trips.length;
        const totalDistance = trips.reduce((sum, trip) => sum + trip.distance, 0);
        const averageSafetyScore =
          totalTrips > 0
            ? trips.reduce((sum, trip) => sum + trip.safetyScore, 0) / totalTrips
            : 100;
        const totalCrashes = crashEvents.length;

        return {
          ...driver.toJSON(),
          stats: {
            totalTrips,
            totalDistance: Math.round(totalDistance * 10) / 10,
            averageSafetyScore: Math.round(averageSafetyScore),
            totalCrashes,
          },
        };
      })
    );

    successResponse(res, { drivers: driversWithStats }, 'Drivers retrieved successfully');
  }
);

/**
 * @desc    Get driver rankings by safety score (admin only)
 * @route   GET /api/fleet/rankings
 * @access  Private (Admin)
 */
export const getDriverRankings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const drivers = await User.find({ role: 'driver' }).select('-password -refreshToken');

    // Calculate safety scores for each driver
    const rankings = await Promise.all(
      drivers.map(async (driver) => {
        const trips = await Trip.find({ userId: driver._id });
        const crashEvents = await CrashEvent.find({ userId: driver._id });

        const totalTrips = trips.length;
        const averageSafetyScore =
          totalTrips > 0
            ? trips.reduce((sum, trip) => sum + trip.safetyScore, 0) / totalTrips
            : 100;
        const totalCrashes = crashEvents.length;
        const totalHarshEvents = trips.reduce(
          (sum, trip) => sum + trip.harshEvents.length,
          0
        );

        return {
          driverId: driver._id,
          name: driver.name,
          email: driver.email,
          safetyScore: Math.round(averageSafetyScore),
          totalTrips,
          totalCrashes,
          totalHarshEvents,
        };
      })
    );

    // Sort by safety score (descending)
    rankings.sort((a, b) => b.safetyScore - a.safetyScore);

    successResponse(res, { rankings }, 'Driver rankings retrieved successfully');
  }
);
