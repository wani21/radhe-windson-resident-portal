import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { AUTH_COOKIE_NAME } from '../../middleware/auth';
import { env } from '../../config/env';

const COOKIE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

export class AuthController {
  /**
   * Handle user login, set HttpOnly cookie, and return profile.
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, token } = await authService.login(req.body);

      // Set hardened HttpOnly session cookie
      res.cookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE_MS,
      });

      sendSuccess(res, { user }, 200, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle user logout and clear authentication cookie.
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      sendSuccess(res, null, 200, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve the currently authenticated user's session profile.
   */
  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getMe(req.user!._id.toString());
      sendSuccess(res, { user }, 200, 'Authenticated user profile retrieved');
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
