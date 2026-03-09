import express from 'express';
import {
  createCrashEvent,
  getCrashEvents,
  getCrashEventById,
  updateCrashEvent,
} from '../controllers/crashController';
import { crashEventValidation, validate } from '../middleware/validation';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * Crash Event Routes
 */
router.post('/', protect, crashEventValidation, validate, createCrashEvent);
router.get('/', protect, getCrashEvents);
router.get('/:id', protect, getCrashEventById);
router.put('/:id', protect, updateCrashEvent);

export default router;
