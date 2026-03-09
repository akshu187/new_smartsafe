import express from 'express';
import { getDrivers, getDriverRankings } from '../controllers/fleetController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * Fleet Routes (Admin Only)
 */
router.get('/drivers', protect, authorize('admin'), getDrivers);
router.get('/rankings', protect, authorize('admin'), getDriverRankings);

export default router;
