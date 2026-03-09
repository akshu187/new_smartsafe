import { Request, Response } from 'express';
import User from '../models/User';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../utils/errorHandler';
import { successResponse } from '../utils/response';
import { jwtConfig } from '../config/jwt';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'driver',
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Save refresh token to database
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, jwtConfig.cookie);

    successResponse(
      res,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken: tokens.accessToken,
      },
      'User registered successfully',
      201
    );
  }
);

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Save refresh token to database
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, jwtConfig.cookie);

    successResponse(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    }, 'Login successful');
  }
);

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public (requires refresh token in cookie)
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token not found', 401);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check if refresh token matches
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Update refresh token in database
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Set new refresh token in cookie
    res.cookie('refreshToken', tokens.refreshToken, jwtConfig.cookie);

    successResponse(res, {
      accessToken: tokens.accessToken,
    }, 'Token refreshed successfully');
  }
);

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (userId) {
      // Clear refresh token from database
      await User.findByIdAndUpdate(userId, { refreshToken: undefined });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    successResponse(res, null, 'Logout successful');
  }
);
