import { Request, Response, NextFunction } from 'express';
import CrashEvent from '../models/CrashEvent';
import { asyncHandler } from '../utils/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AppError } from '../utils/errorHandler';

/**
 * @desc    Create new crash event
 * @route   POST /api/crashes
 * @access  Private
 */
export const createCrashEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    const crashEvent = await CrashEvent.create({
      userId,
      ...req.body,
    });

    successResponse(res, { crashEvent }, 'Crash event created successfully', 201);
  }
);

/**
 * @desc    Get all crash events for current user
 * @route   GET /api/crashes
 * @access  Private
 */
export const getCrashEvents = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = { userId };

    // Filter by severity if provided
    if (req.query.severity) {
      query.severity = req.query.severity;
    }

    // Filter by SOS status if provided
    if (req.query.sosTriggered !== undefined) {
      query.sosTriggered = req.query.sosTriggered === 'true';
    }

    const crashEvents = await CrashEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CrashEvent.countDocuments(query);

    paginatedResponse(res, crashEvents, page, limit, total, 'Crash events retrieved successfully');
  }
);

/**
 * @desc    Get single crash event by ID
 * @route   GET /api/crashes/:id
 * @access  Private
 */
export const getCrashEventById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const crashId = req.params.id;

    const crashEvent = await CrashEvent.findOne({ _id: crashId, userId });

    if (!crashEvent) {
      throw new AppError('Crash event not found', 404);
    }

    successResponse(res, { crashEvent }, 'Crash event retrieved successfully');
  }
);

/**
 * @desc    Update crash event (e.g., mark SOS as sent)
 * @route   PUT /api/crashes/:id
 * @access  Private
 */
export const updateCrashEvent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const crashId = req.params.id;

    const crashEvent = await CrashEvent.findOneAndUpdate(
      { _id: crashId, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!crashEvent) {
      throw new AppError('Crash event not found', 404);
    }

    successResponse(res, { crashEvent }, 'Crash event updated successfully');
  }
);
