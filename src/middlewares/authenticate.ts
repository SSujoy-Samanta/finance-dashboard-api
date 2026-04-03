import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { AppError } from '@/utils/AppError';
import { verifyAccessToken } from '@/utils/jwt';
import { prisma } from '@/config/db';
import { Role, Status } from '@/generated/prisma/client';

/**
 * Authentication middleware that verifies the JWT access token provided in the Authorization header.
 * 
 * Flow:
 * 1. Extracts 'Bearer' token from headers.
 * 2. Decodes and verifies the JWT.
 * 3. Checks if the user exists and is active in the database.
 * 4. Attaches basic user info (id, email, role) to the Express Request object.
 * 
 * @param {Request} req - Express request object.
 * @param {Response} _res - Express response object.
 * @param {NextFunction} next - Express next function.
 * @throws {AppError} 401 - If token is missing, invalid, or user is not found/active.
 */
export const authenticate = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authenticated', 401, 'MISSING_TOKEN');
    }

    try {
      const decoded = verifyAccessToken(token);

      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, deletedAt: null },
      });

      if (!user) {
        throw new AppError('User not found', 401, 'USER_NOT_FOUND');
      }

      if (user.status === Status.INACTIVE) {
        throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
      };

      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
  },
);
