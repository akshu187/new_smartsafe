import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
} from '../controllers/authController';
import {
  registerValidation,
  loginValidation,
  validate,
} from '../middleware/validation';
import { protect } from '../middleware/auth';

const router = express.Router();

/**
 * Auth Routes
 */
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);

export default router;
