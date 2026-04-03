import crypto from 'node:crypto';
import argon2 from 'argon2';
import { User, Role, Status, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/config/db';
import { env } from '@/config/env';
import logger from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { where } from '@/config/queryFilters';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/utils/jwt';
import { RegisterInput, LoginInput } from '@/modules/auth/auth.schema';

/**
 * Represents a user object safe for client-side consumption, 
 * with sensitive security fields removed.
 */
export type SanitizedUser = Omit<User, 'password' | 'refreshToken'>;

export class AuthService {
  /**
   * Returns Argon2 configuration based on the current environment.
   * Uses low-intensity parameters in 'test' mode to speed up execution.
   * 
   * @public
   */
  public static getArgonConfig() {
    const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
    return {
      type: argon2.argon2id,
      memoryCost: isDev ? 2 ** 12 : 2 ** 16, // 4MB in dev/test, 64MB in prod
      timeCost: isDev ? 1 : 3,
      parallelism: isDev ? 1 : 1,
    };
  }

  /**
   * Registers a new user in the system.
   * Hashes the password using Argon2id and generates initial access/refresh tokens.
   * 
   * @param {RegisterInput} data - The user registration data (name, email, password).
   * @returns {Promise<{user: SanitizedUser, accessToken: string, refreshToken: string}>} - The created user and authentication tokens.
   * @throws {AppError} 409 - If the email is already in use.
   */
  static async register(data: RegisterInput): Promise<{ user: SanitizedUser, accessToken: string, refreshToken: string }> {
    // HASHING OUTSIDE OF TRANSACTION
    const hashedPassword = await argon2.hash(data.password, this.getArgonConfig());

    // Pre-generate ID and tokens to combine DB operations
    const userId = crypto.randomUUID();
    const payload = { userId, email: data.email, role: Role.VIEWER };
    
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const user = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: { email: data.email, ...where.user.active },
      });

      if (existingUser) {
        throw new AppError('Email already in use', 409, 'DUPLICATE_ENTRY');
      }

      return tx.user.create({
        data: {
          id: userId,
          email: data.email,
          name: data.name,
          password: hashedPassword,
          refreshToken: hashedRefreshToken,
          role: Role.VIEWER,
          status: Status.ACTIVE,
        },
      });
    }, { maxWait: 5000, timeout: 10000 });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticates a user by email and password.
   * Verifies the password using Argon2 and generates new authentication tokens.
   * 
   * @param {LoginInput} data - The login credentials (email, password).
   * @returns {Promise<{user: SanitizedUser, accessToken: string, refreshToken: string}>} - The authenticated user and tokens.
   * @throws {AppError} 401 - If credentials are invalid.
   */
  static async login(data: LoginInput): Promise<{ user: SanitizedUser, accessToken: string, refreshToken: string }> {
    const user = await prisma.user.findFirst({
      where: { email: data.email, deletedAt: null },
    });

    if (!user || !(await argon2.verify(user.password, data.password))) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === Status.INACTIVE) {
      logger.warn({ email: data.email }, 'Inactive user attempted login');
      throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }



    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * Verifies the rotation token against the database-stored hash.
   * 
   * @param {string} token - The raw refresh token.
   * @returns {Promise<{accessToken: string}>} - A newly generated access token.
   * @throws {AppError} 401 - If the token is invalid, used, or user not found.
   */
  static async refresh(token: string) {
    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, deletedAt: null },
    });

    if (!user || !user.refreshToken) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    if (user.status === Status.INACTIVE) {
      logger.warn({ userId: user.id }, 'Inactive user attempted token refresh');
      throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Timing-safe comparison to prevent timing attacks
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(user.refreshToken, 'hex'),
      Buffer.from(hash, 'hex')
    );

    if (!isMatch) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }

  /**
   * Logs out a user by invalidating their refresh token in the database.
   * 
   * @param {string} userId - The unique identifier of the user.
   * @returns {Promise<void>}
   */
  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Generates a pair of JWT tokens (access & refresh) for a user.
   * The refresh token is hashed and persisted to the database for validation.
   * 
   * @param {User} user - The user entity from Prisma.
   * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   * @private
   */
  private static async generateTokens(user: User, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    await client.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Removes sensitive fields (password, refresh token hash) from the user object.
   * 
   * @param {User} user - The raw user entity.
   * @returns {SanitizedUser} - The user object safe for public/client consumption.
   * @private
   */
  private static sanitizeUser(user: User): SanitizedUser {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized;
  }
}
