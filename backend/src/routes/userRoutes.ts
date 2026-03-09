import express from 'express';
import { getMe } from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * User Routes
 */
router.get('/me', protect, getMe);

export default router;
