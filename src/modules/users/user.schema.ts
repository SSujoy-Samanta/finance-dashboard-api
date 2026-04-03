import { z } from 'zod';
import { Role, Status } from '@/generated/prisma/client';

/**
 * Validation schema for creating a new user (Administrative).
 */
export const createUserSchema = z.object({
  body: z.object({
    /** User's email address */
    email: z.string().email(),
    /** User's full name */
    name: z.string().min(2),
    /** User's secure password */
    password: z.string().min(8),
    /** Optional assigned role (defaults to VIEWER if not provided in service) */
    role: z.nativeEnum(Role).optional(),
  }),
});

/**
 * Validation schema for updating an existing user's details.
 */
export const updateUserSchema = z.object({
  params: z.object({
    /** The unique UUID of the user */
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(Status).optional(),
  }).partial(),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});


/**
 * Validation schema for listing users with pagination.
 */
export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

/** Type definition for creating a user */
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
/** Type definition for updating a user */
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
/** Type definition for listing users query parameters */
export type ListUsersQuery = z.infer<typeof listUsersSchema>['query'];
