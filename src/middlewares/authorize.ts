import { Request, Response, NextFunction } from 'express';
import { Role } from '@/generated/prisma/client';
import { catchAsync } from '@/utils/catchAsync';
import { AppError } from '@/utils/AppError';
import { ROLE_PERMISSIONS, Permission } from '@/config/permissions';

/**
 * Authorization middleware that enforces Role-Based Access Control (RBAC).
 * Checks if the authenticated user has the required permission to access a route.
 * 
 * @param {Permission} permission - The specific permission required (e.g., 'records:create').
 * @returns {Function} - An Express middleware function.
 * @throws {AppError} 403 - If the user's role does not include the required permission.
 */
export const authorize = (permission: Permission) =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const userRole = req.user.role;

    if (userRole === Role.ADMIN) {
      return next();
    }

    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (!permissions.includes(permission)) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  });
