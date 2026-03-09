import { Request, Response } from 'express';
import User from '../models/User';
import { asyncHandler } from '../utils/errorHandler';
import { successResponse } from '../utils/response';

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMe = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.findById(req.user?._id);

    successResponse(res, { user }, 'User profile retrieved successfully');
  }
);
