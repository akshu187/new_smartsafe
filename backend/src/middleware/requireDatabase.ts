import { Request, Response, NextFunction } from 'express';
import { isDatabaseConnected } from '../config/database';
import { errorResponse } from '../utils/response';

export const requireDatabaseConnection = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isDatabaseConnected()) {
    return errorResponse(
      res,
      'Database is currently unavailable. Please try again shortly.',
      503
    );
  }

  next();
};
