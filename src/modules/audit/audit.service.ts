import { AuditAction, Prisma, AuditLog } from '@/generated/prisma/client';
import { prisma } from '@/config/db';

/**
 * Represents the data structure for a single audit log entry.
 */
export interface AuditLogData {
  /** The ID of the user who performed the action */
  userId: string;
  /** The specific action performed (from AuditAction enum) */
  action: AuditAction;
  /** The name of the entity involved (e.g., 'User', 'FinancialRecord') */
  entity: string;
  /** The unique identifier of the entity involved */
  entityId: string;
  /** Optional JSON metadata capturing before/after snapshots or context */
  metadata?: Prisma.JsonValue;
  /** The IP address from which the request originated */
  ipAddress?: string;
  /** The user agent string of the client */
  userAgent?: string;
}

export class AuditService {
  /**
   * Persists a new audit log entry to the database.
   * 
   * @param {AuditLogData} data - The audit information to be logged.
   * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client for atomic operations.
   * @returns {Promise<AuditLog>} - The created audit log record.
   */
  static async log(data: AuditLogData, tx?: Prisma.TransactionClient): Promise<AuditLog> {
    const client = tx || prisma;
    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        metadata: data.metadata as Prisma.InputJsonValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Retrieves a paginated list of audit logs based on provided filters.
   * 
   * @param {Object} filters - Search and pagination filters.
   * @param {string} [filters.userId] - Filter by a specific user.
   * @param {string} [filters.entity] - Filter by entity type.
   * @param {string} [filters.entityId] - Filter by a specific entity ID.
   * @param {number} filters.page - The current page number.
   * @param {number} filters.limit - Number of logs per page.
   * @returns {Promise<{logs: (AuditLog & { user: { id: string, name: string, email: string } })[], total: number}>} - The list of logs and the total count.
   */
  static async getLogs(filters: {
    userId?: string;
    entity?: string;
    entityId?: string;
    page: number;
    limit: number;
  }): Promise<{ logs: (AuditLog & { user: { id: string, name: string, email: string } })[], total: number }> {
    const skip = (filters.page - 1) * filters.limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          userId: filters.userId,
          entity: filters.entity,
          entityId: filters.entityId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({
        where: {
          userId: filters.userId,
          entity: filters.entity,
          entityId: filters.entityId,
        },
      }),
    ]);

    return { logs, total };
  }
}
