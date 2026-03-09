import express from 'express';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} from '../controllers/tripController';
import { tripValidation, validate } from '../middleware/validation';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * Trip Routes
 */
router.post('/', protect, tripValidation, validate, createTrip);
router.get('/', protect, getTrips);
router.get('/:id', protect, getTripById);
router.put('/:id', protect, updateTrip);
router.delete('/:id', protect, deleteTrip);

export default router;
