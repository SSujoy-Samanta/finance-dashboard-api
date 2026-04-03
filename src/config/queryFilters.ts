import { Prisma, Status } from '@/generated/prisma/client';

/**
 * Pre-defined Prisma query filters for common scenarios.
 * This improves code readability and prevents repetitive query construction.
 */

const user = {
  /**
   * Filter for active users (not deleted and status is ACTIVE).
   */
  active: { deletedAt: null, status: Status.ACTIVE } satisfies Prisma.UserWhereInput,
  /**
   * Update input for restoring a user (setting deletedAt to null and status to ACTIVE).
   */
  restore: { deletedAt: null, status: Status.ACTIVE } satisfies Prisma.UserUpdateInput,
} as const;

const financialRecord = {
  /**
   * Filter for active financial records (not deleted).
   */
  active: { deletedAt: null } satisfies Prisma.FinancialRecordWhereInput,
  /**
   * Update input for restoring a financial record (setting deletedAt to null).
   */
  restore: { deletedAt: null } satisfies Prisma.FinancialRecordUpdateInput,
} as const;

export const where = {
  user,
  financialRecord,
} as const;
