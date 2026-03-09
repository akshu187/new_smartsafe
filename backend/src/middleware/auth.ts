import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, IJwtPayload } from '../utils/jwt';
import { AppError } from '../utils/errorHandler';
import User from '../models/User';

/**
 * Extend Express Request to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload & { _id: string };
    }
  }
}

/**
 * Protect Routes - Verify JWT Access Token
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      throw new AppError('Not authorized, no token provided', 401);
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Attach user to request
    req.user = {
      ...decoded,
      _id: user._id.toString(),
    };

    next();
  } catch (error: any) {
    if (error.message === 'Invalid or expired access token') {
      return next(new AppError('Token expired or invalid', 401));
    }
    next(error);
  }
};

/**
 * Authorize Roles - Check if user has required role
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }

    next();
  };
};
