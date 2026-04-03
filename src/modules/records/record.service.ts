import { FinancialRecord, Prisma, AuditAction } from '@/generated/prisma/client';
import { prisma } from '@/config/db';
import { AppError } from '@/utils/AppError';
import { getPaginationMeta } from '@/utils/pagination';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateRecordInput, UpdateRecordInput, ListRecordsQuery } from './record.schema';
import { Decimal } from 'decimal.js';
import { where } from '@/config/queryFilters';
import { EntityName } from '@/utils/constants';
import { PaginationMeta } from '@/utils/ApiResponse';

/**
 * Represents a financial record where the 'amount' field (Decimal) 
 * has been serialized to a string for consistency in JSON responses.
 */
export type SerializedFinancialRecord = Omit<FinancialRecord, 'amount'> & { amount: string };

export class RecordService {
  /**
   * Creates a new financial record and logs the action to the audit trail.
   * 
   * @param {CreateRecordInput} data - The record details (amount, type, category, date, etc.).
   * @param {string} userId - The ID of the user creating the record.
   * @param {string} [ip] - The originating IP address for auditing.
   * @param {string} [ua] - The originating user agent for auditing.
   * @returns {Promise<FinancialRecord>} - The newly created financial record.
   */
  static async create(data: CreateRecordInput, userId: string, ip?: string, ua?: string) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.financialRecord.create({
        data: {
          ...data,
          amount: new Decimal(data.amount),
          createdById: userId,
        },
      });

      await AuditService.log({
        userId,
        action: AuditAction.RECORD_CREATED,
        entity: EntityName.FINANCIAL_RECORD,
        entityId: record.id,
        metadata: {
          amount: record.amount.toString(),
          type: record.type,
          category: record.category,
        },
        ipAddress: ip,
        userAgent: ua,
      }, tx);

      return record;
    }, { maxWait: 5000, timeout: 10000 });
  }

  /**
   * Retrieves a paginated list of financial records based on search and filter criteria.
   * Automatically filters out soft-deleted records.
   * 
   * @param {ListRecordsQuery} query - Filtering, searching, and pagination parameters.
   * @returns {Promise<{data: SerializedFinancialRecord[], meta: PaginationMeta}>} - Paginated record data and metadata.
   */
  static async list(query: ListRecordsQuery): Promise<{ data: SerializedFinancialRecord[], meta: PaginationMeta }> {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: Prisma.FinancialRecordWhereInput = {
      ...where.financialRecord.active,
    };

    if (type) whereClause.type = type;
    if (category) {
      whereClause.category = { contains: category, mode: Prisma.QueryMode.insensitive };
    }
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate as string);
      if (endDate) whereClause.date.lte = new Date(endDate as string);
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      whereClause.amount = {};
      if (minAmount !== undefined) whereClause.amount.gte = new Decimal(minAmount as number | string);
      if (maxAmount !== undefined) whereClause.amount.lte = new Decimal(maxAmount as number | string);
    }
    if (search) {
      whereClause.OR = [
        { category: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
        { notes: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    try {
      const [records, total] = await Promise.all([
        prisma.financialRecord.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.financialRecord.count({ where: whereClause }),
      ]);

      return {
        data: records.map((r: FinancialRecord) => ({ ...r, amount: r.amount.toString() })),
        meta: getPaginationMeta(page, limit, total),
      };
    } catch (error) {
      console.error('[RecordService.list] ERROR:', error);
      throw error;
    }
  }

  /**
   * Fetches a single financial record by its unique identifier.
   * 
   * @param {string} id - The record's unique ID.
   * @returns {Promise<SerializedFinancialRecord & { createdBy: { id: string, name: string, email: string } }>} - The record data with creator information.
   * @throws {AppError} 404 - If the record does not exist or is deleted.
   */
  static async getById(id: string): Promise<SerializedFinancialRecord & { createdBy: { id: string, name: string, email: string } }> {
    const record = await prisma.financialRecord.findFirst({
      where: { id, ...where.financialRecord.active },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!record) {
      throw new AppError('Record not found', 404, 'NOT_FOUND');
    }

    return { ...record, amount: record.amount.toString() };
  }

  /**
   * Updates an existing financial record and logs the change with before/after snapshots.
   * 
   * @param {string} id - The ID of the record to update.
   * @param {UpdateRecordInput} data - The fields to be updated.
   * @param {string} userId - The ID of the user performing the update.
   * @param {string} [ip] - The originating IP address for auditing.
   * @param {string} [ua] - The originating user agent for auditing.
   * @returns {Promise<SerializedFinancialRecord>} - The updated record data.
   * @throws {AppError} 404 - If the record does not exist or is deleted.
   */
  static async update(id: string, data: UpdateRecordInput, userId: string, ip?: string, ua?: string): Promise<SerializedFinancialRecord> {
    return prisma.$transaction(async (tx) => {
      const before = await tx.financialRecord.findFirst({
        where: { id, ...where.financialRecord.active },
      });

      if (!before) {
        throw new AppError('Record not found', 404, 'NOT_FOUND');
      }

      const record = await tx.financialRecord.update({
        where: { id },
        data: {
          ...data as Prisma.FinancialRecordUpdateInput,
          amount: data.amount ? new Decimal(data.amount) : undefined,
        },
      });

      await AuditService.log({
        userId,
        action: AuditAction.RECORD_UPDATED,
        entity: EntityName.FINANCIAL_RECORD,
        entityId: record.id,
        metadata: JSON.parse(JSON.stringify({
          before: { ...before, amount: before.amount.toString() },
          after: { ...record, amount: record.amount.toString() },
        })),
        ipAddress: ip,
        userAgent: ua,
      }, tx);

      return { ...record, amount: record.amount.toString() };
    }, { maxWait: 5000, timeout: 10000 });
  }

  /**
   * Performs a soft-delete on a financial record by setting its 'deletedAt' timestamp.
   * 
   * @param {string} id - The ID of the record to delete.
   * @param {string} userId - The ID of the user performing the deletion.
   * @param {string} [ip] - The originating IP address for auditing.
   * @param {string} [ua] - The originating user agent for auditing.
   * @returns {Promise<void>}
   * @throws {AppError} 404 - If the record does not exist or is already deleted.
   */
  static async delete(id: string, userId: string, ip?: string, ua?: string) {
    await prisma.$transaction(async (tx) => {
      const record = await tx.financialRecord.findFirst({
        where: { id, ...where.financialRecord.active },
      });

      if (!record) {
        throw new AppError('Record not found', 404, 'NOT_FOUND');
      }

      await tx.financialRecord.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await AuditService.log({
        userId,
        action: AuditAction.RECORD_DELETED,
        entity: EntityName.FINANCIAL_RECORD,
        entityId: id,
        ipAddress: ip,
        userAgent: ua,
      }, tx);
    }, { maxWait: 5000, timeout: 10000 });
  }
}
