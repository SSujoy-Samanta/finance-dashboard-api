import argon2 from 'argon2';
import { User, AuditAction, Status, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/config/db';
import { SanitizedUser, AuthService } from '@/modules/auth/auth.service';
import { AppError } from '@/utils/AppError';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from '@/modules/users/user.schema';
import { getPaginationMeta } from '@/utils/pagination';
import { AuditService } from '@/modules/audit/audit.service';
import { where } from '@/config/queryFilters';
import { EntityName } from '@/utils/constants';
import { PaginationMeta } from '@/utils/ApiResponse';

export class UserService {
  /**
   * Creates a new user in the system (Admin only action).
   * Hashes the password and logs the creation to the audit trail.
   * 
   * @param {CreateUserInput} data - The user details (email, name, role, password).
   * @param {string} adminId - The ID of the administrator performing the action.
   * @param {string} [ip] - The originating IP address for auditing.
   * @param {string} [ua] - The originating user agent for auditing.
   * @returns {Promise<SanitizedUser>} - The sanitized user object.
   * @throws {AppError} 409 - If the email is already in use.
   */
  static async create(data: CreateUserInput, adminId: string, ip?: string, ua?: string): Promise<SanitizedUser> {
    // MOVE HASHING OUTSIDE OF TRANSACTION
    const hashedPassword = await argon2.hash(data.password as string, AuthService.getArgonConfig());

    return prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { email: data.email, ...where.user.active }
      });
      if (existing) throw new AppError('Email already in use', 409, 'DUPLICATE_ENTRY');

      const user = await tx.user.create({
        data: {
          ...data as Prisma.UserCreateInput,
          password: hashedPassword,
        },
      });

      await AuditService.log({
        userId: adminId,
        action: AuditAction.USER_CREATED,
        entity: EntityName.USER,
        entityId: user.id,
        metadata: { email: user.email, role: user.role },
        ipAddress: ip,
        userAgent: ua,
      }, tx);

      return this.sanitizeUser(user);
    }, { maxWait: 5000, timeout: 10000 });
  }

  /**
   * Retrieves a paginated list of all active users in the system.
   * 
   * @param {ListUsersQuery} query - Pagination parameters (page, limit).
   * @returns {Promise<{ data: SanitizedUser[], meta: PaginationMeta }>} - List of sanitized user objects and metadata.
   */
  static async list(query: ListUsersQuery): Promise<{ data: SanitizedUser[], meta: PaginationMeta }> {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: where.user.active,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: where.user.active }),
    ]);

    return {
      data: users.map((u: User) => this.sanitizeUser(u)),
      meta: getPaginationMeta(page, limit, total),
    };
  }

  /**
   * Fetches a single active user by their unique identifier.
   * 
   * @param {string} id - The user's unique ID.
   * @returns {Promise<SanitizedUser>} - The sanitized user object.
   * @throws {AppError} 404 - If the user does not exist or is deleted.
   */
  static async getById(id: string): Promise<SanitizedUser> {
    const user = await prisma.user.findFirst({
      where: { id, ...where.user.active }
    });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return this.sanitizeUser(user);
  }

  /**
   * Updates an existing user's information and logs the action.
   * Discriminates between standard updates and account deactivations for audit logging.
   * 
   * @param {string} id - The ID of the user to update.
   * @param {UpdateUserInput} data - The fields to be updated.
   * @param {string} adminId - The ID of the administrator performing the action.
   * @param {string} [ip] - The originating IP address for auditing.
   * @param {string} [ua] - The originating user agent for auditing.
   * @returns {Promise<SanitizedUser>} - The updated sanitized user object.
   * @throws {AppError} 404 - If the user does not exist or is deleted.
   */
  static async update(id: string, data: UpdateUserInput, adminId: string, ip?: string, ua?: string): Promise<SanitizedUser> {
    return prisma.$transaction(async (tx) => {
      const before = await tx.user.findFirst({
        where: { id, ...where.user.active }
      });
      if (!before) throw new AppError('User not found', 404, 'NOT_FOUND');

      const user = await tx.user.update({
        where: { id },
        data: data as Prisma.UserUpdateInput,
      });

      let action: AuditAction = AuditAction.USER_UPDATED;
      if (data.status === Status.INACTIVE && before.status === Status.ACTIVE) {
        action = AuditAction.USER_DEACTIVATED;
      }

      await AuditService.log({
        userId: adminId,
        action,
        entity: EntityName.USER,
        entityId: user.id,
        metadata: JSON.parse(JSON.stringify({
          before: this.sanitizeUser(before),
          after: this.sanitizeUser(user)
        })),
        ipAddress: ip,
        userAgent: ua,
      }, tx);

      return this.sanitizeUser(user);
    }, { maxWait: 5000, timeout: 10000 });
  }

  /**
   * Utility to remove sensitive security fields from the user object.
   * 
   * @param {User} user - The raw user entity from Prisma.
   * @returns {SanitizedUser} - The user object without password or refresh token.
   * @private
   */
  private static sanitizeUser(user: User): SanitizedUser {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized;
  }
}
