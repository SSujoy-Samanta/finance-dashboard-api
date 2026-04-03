import { z } from 'zod';
import { RecordType } from '@/generated/prisma/client';

/**
 * Validation schema for creating a new financial record.
 */
export const createRecordSchema = z.object({
  body: z.object({
    /** The monetary value of the record (must be positive) */
    amount: z.number().positive('Amount must be a positive number'),
    /** Type of transaction (INCOME or EXPENSE) */
    type: z.nativeEnum(RecordType),
    /** Category name (e.g., 'Salary', 'Groceries') */
    category: z.string().trim().min(1, 'Category is required'),
    /** ISO 8601 transaction date */
    date: z.string().datetime('Invalid date format'),
    /** Optional detailed notes (max 500 characters) */
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
    /** Optional reference code or ID */
    reference: z.string().optional(),
  }),
});

/**
 * Validation schema for updating an existing financial record.
 * All body fields are optional to allow partial updates.
 */
export const updateRecordSchema = z.object({
  params: z.object({
    /** The unique UUID of the record */
    id: z.string(),
  }),
  body: z.object({
    amount: z.number().positive().optional(),
    type: z.nativeEnum(RecordType).optional(),
    category: z.string().trim().min(1).optional(),
    date: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
    reference: z.string().optional(),
  }).partial(),
});

/**
 * Validation schema for retrieving a single financial record by ID.
 */
export const getRecordSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

/**
 * Validation schema for listing financial records with filtering and pagination.
 * Includes complex refinements for range validation (dates and amounts).
 */
export const listRecordsSchema = z.object({
  query: z.object({
    /** Page number for pagination */
    page: z.coerce.number().int().min(1).default(1),
    /** Items per page */
    limit: z.coerce.number().int().min(1).max(100).default(10),
    /** Filter by transaction type */
    type: z.nativeEnum(RecordType).optional(),
    /** Filter by category name */
    category: z.string().optional(),
    /** Filter for records starting from this date */
    startDate: z.string().datetime().optional(),
    /** Filter for records up to this date */
    endDate: z.string().datetime().optional(),
    /** Filter by minimum amount */
    minAmount: z.coerce.number().optional(),
    /** Filter by maximum amount */
    maxAmount: z.coerce.number().optional(),
    /** Generic search term across category and reference */
    search: z.string().optional(),
    /** Field to sort the results by */
    sortBy: z.enum(['amount', 'date', 'createdAt']).default('createdAt'),
    /** Order of sorting */
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }).refine((data: Record<string, unknown>) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate as string) <= new Date(data.endDate as string);
    }
    return true;
  }, {
    message: 'startDate must be before or equal to endDate',
    path: ['startDate'],
  }).refine((data: Record<string, unknown>) => {
    if (data.minAmount !== undefined && data.maxAmount !== undefined) {
      return (data.minAmount as number) <= (data.maxAmount as number);
    }
    return true;
  }, {
    message: 'minAmount must be less than or equal to maxAmount',
    path: ['minAmount'],
  }),
});

/** Type definition for creating a record */
export type CreateRecordInput = z.infer<typeof createRecordSchema>['body'];
/** Type definition for updating a record */
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>['body'];
/** Type definition for listing records query parameters */
export type ListRecordsQuery = z.infer<typeof listRecordsSchema>['query'];
