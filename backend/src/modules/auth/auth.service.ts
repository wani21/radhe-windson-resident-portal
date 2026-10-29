import { User, IUser } from '../../models/user.model';
import { comparePassword, generateToken } from '../../utils/security';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { LoginInput } from './auth.schema';

export interface UserSanitized {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  phone?: string | null;
  flatId?: string | null;
  createdAt: Date;
}

export const sanitizeUser = (user: IUser): UserSanitized => {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone || null,
    flatId: user.flatId ? user.flatId.toString() : null,
    createdAt: user.createdAt,
  };
};

export class AuthService {
  /**
   * Authenticate user credentials and issue operational JWT.
   */
  async login(input: LoginInput): Promise<{ user: UserSanitized; token: string }> {
    const user = await User.findOne({ email: input.email }).select('+passwordHash');

    if (!user || user.isDeleted) {
      throw new UnauthorizedError('Invalid email address or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Your account has been deactivated. Please contact society administration.');
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email address or password.');
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  /**
   * Retrieve the authenticated user's current profile.
   */
  async getMe(userId: string): Promise<UserSanitized> {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      throw new NotFoundError('User profile not found.');
    }
    return sanitizeUser(user);
  }

  /**
   * Revoke all active sessions by incrementing tokenVersion.
   */
  async revokeSessions(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  }
}

export const authService = new AuthService();
