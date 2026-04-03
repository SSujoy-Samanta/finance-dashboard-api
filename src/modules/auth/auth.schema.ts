import { z } from 'zod';

/**
 * Internal password validation schema.
 * Enforces:
 * - Minimum 8 characters.
 * - At least one uppercase letter.
 * - At least one lowercase letter.
 * - At least one number.
 * - At least one special character.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

/**
 * Validation schema for the user registration request.
 */
export const registerSchema = z.object({
  body: z.object({
    /** User's email address (unique in system) */
    email: z.string().email('Invalid email address').toLowerCase(),
    /** User's secure password */
    password: passwordSchema,
    /** User's full name */
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
});

/**
 * Validation schema for the user login request.
 */
export const loginSchema = z.object({
  body: z.object({
    /** Registered email address */
    email: z.string().email('Invalid email address').toLowerCase(),
    /** User's password */
    password: z.string().min(1, 'Password is required'),
  }),
});

/** Type definition for the registration request body */
export type RegisterInput = z.infer<typeof registerSchema>['body'];
/** Type definition for the login request body */
export type LoginInput = z.infer<typeof loginSchema>['body'];
