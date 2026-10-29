import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/security';
import { User, IUser, UserRole } from '../models/user.model';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

// Extend Express Request interface to hold authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const AUTH_COOKIE_NAME = 'rw_token';

/**
 * Authentication middleware: Validates JWT from HttpOnly cookie or Authorization header.
 * Enforces token expiration, tokenVersion matching, and active account status.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined = req.cookies?.[AUTH_COOKIE_NAME];

    // Fallback: Check standard Authorization Bearer header for API/CLI consumers
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication session not found. Please log in.');
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      throw new UnauthorizedError('Invalid or expired authentication session. Please log in again.');
    }

    // Retrieve user and verify account status & token version
    const user = await User.findById(decoded.userId);

    if (!user || user.isDeleted) {
      throw new UnauthorizedError('User account associated with this session no longer exists.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Your account has been deactivated. Please contact society administration.');
    }

    // Instant multi-device invalidation check
    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new UnauthorizedError('Session has been revoked. Please log in again.');
    }

    // Attach validated user instance to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware.
 * Asserts that the authenticated user possesses one of the required roles.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role [${req.user.role}] is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};
