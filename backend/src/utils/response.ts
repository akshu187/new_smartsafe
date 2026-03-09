import { Response } from 'express';

/**
 * Standard Success Response
 */
export const successResponse = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard Error Response
 */
export const errorResponse = (
  res: Response,
  message: string = 'Error',
  statusCode: number = 500,
  errors?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

/**
 * Paginated Response
 */
export const paginatedResponse = (
  res: Response,
  data: any[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Success'
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};
