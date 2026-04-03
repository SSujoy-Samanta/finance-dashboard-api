import { Role } from '@/generated/prisma/client';

/**
 * Augments the Express Request interface to include user information.
 * This declaration is used by the authentication middleware to attach user data to the request object.
 */
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
    }
  }
}
