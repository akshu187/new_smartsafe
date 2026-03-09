import { Request, Response } from 'express';
import Trip from '../models/Trip';
import { asyncHandler } from '../utils/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AppError } from '../utils/errorHandler';

/**
 * @desc    Create new trip
 * @route   POST /api/trips
 * @access  Private
 */
export const createTrip = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const trip = await Trip.create({
      userId,
      ...req.body,
    });

    successResponse(res, { trip }, 'Trip created successfully', 201);
  }
);

/**
 * @desc    Get all trips for current user
 * @route   GET /api/trips
 * @access  Private
 */
export const getTrips = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { userId };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Trip.countDocuments(query);

    paginatedResponse(res, trips, page, limit, total, 'Trips retrieved successfully');
  }
);

/**
 * @desc    Get single trip by ID
 * @route   GET /api/trips/:id
 * @access  Private
 */
export const getTripById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const tripId = req.params.id;

    const trip = await Trip.findOne({ _id: tripId, userId });

    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    successResponse(res, { trip }, 'Trip retrieved successfully');
  }
);

/**
 * @desc    Update trip
 * @route   PUT /api/trips/:id
 * @access  Private
 */
export const updateTrip = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const tripId = req.params.id;

    const trip = await Trip.findOneAndUpdate(
      { _id: tripId, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    successResponse(res, { trip }, 'Trip updated successfully');
  }
);

/**
 * @desc    Delete trip
 * @route   DELETE /api/trips/:id
 * @access  Private
 */
export const deleteTrip = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const tripId = req.params.id;

    const trip = await Trip.findOneAndDelete({ _id: tripId, userId });

    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    successResponse(res, null, 'Trip deleted successfully');
  }
);
