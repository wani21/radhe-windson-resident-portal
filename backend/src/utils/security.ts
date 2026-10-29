import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/user.model';

const BCRYPT_SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  role: UserRole;
  tokenVersion: number;
}

/**
 * Hash a plaintext password with bcryptjs using 12 salt rounds.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compare a plaintext candidate password with a stored bcrypt hash.
 */
export const comparePassword = async (candidate: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(candidate, hash);
};

/**
 * Sign an operational JWT containing essential authorization claims.
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

/**
 * Verify and decode an operational JWT.
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};
