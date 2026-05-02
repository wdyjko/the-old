import { Router } from 'express';
import { register, login, getMe, redeemPoints, usePrize } from '../controllers/authController';
import { getProfile, updateProfile } from '../controllers/userController';
import { auth } from '../middleware/authMiddleware';

const router = Router();

// Define routes
router.post('/register', register);
router.post('/login', login);

// Note: /me will need auth middleware which we will add next
router.get('/me', auth, getMe);

// Redeem points route
router.post('/redeem', auth, redeemPoints);
router.post('/prizes/use', auth, usePrize);

// Profile
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

export default router;
