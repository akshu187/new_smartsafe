import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';
import { errorResponse } from '../utils/response';

/**
 * Validation Error Handler
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', 400, errors.array());
  }
  next();
};

/**
 * Register Validation Rules
 */
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

/**
 * Login Validation Rules
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Trip Validation Rules
 */
export const tripValidation = [
  body('startLocation.latitude')
    .notEmpty()
    .withMessage('Start latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('startLocation.longitude')
    .notEmpty()
    .withMessage('Start longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('distance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),
  body('safetyScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Safety score must be between 0 and 100'),
];

/**
 * Crash Event Validation Rules
 */
export const crashEventValidation = [
  body('location.latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('severity')
    .notEmpty()
    .withMessage('Severity is required')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Severity must be low, medium, or high'),
  body('indicatorsTriggered')
    .isArray({ min: 1 })
    .withMessage('At least one indicator must be triggered'),
  body('confidence')
    .notEmpty()
    .withMessage('Confidence is required')
    .isInt({ min: 0, max: 100 })
    .withMessage('Confidence must be between 0 and 100'),
  body('indicatorCount')
    .notEmpty()
    .withMessage('Indicator count is required')
    .isInt({ min: 0, max: 10 })
    .withMessage('Indicator count must be between 0 and 10'),
];
