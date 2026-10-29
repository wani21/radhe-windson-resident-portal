import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { loginSchema } from './auth.schema';
import { authLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/auth';

const router = Router();

// POST /api/v1/auth/login - Rate-limited & input-validated
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), authController.login);

// POST /api/v1/auth/logout - Clears session cookie
router.post('/logout', authController.logout);

// GET /api/v1/auth/me - Protected route returning active session profile
router.get('/me', authenticate, authController.getMe);

export const authRoutes = router;
