import { Role } from '@/generated/prisma/client';


/**
 * Union type representing all possible permissions in the system.
 * Each permission follows the format 'resource:action'.
 */
export type Permission =
  | 'user:create'
  | 'user:read'
  | 'user:update'
  | 'user:deactivate'
  | 'record:create'
  | 'record:read'
  | 'record:update'
  | 'record:delete'
  | 'dashboard:read'
  | 'audit:read';

/**
 * Defines the permission matrix for each role.
 * Maps each role to a list of specific permissions it possesses.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'user:create',
    'user:read',
    'user:update',
    'user:deactivate',
    'record:create',
    'record:read',
    'record:update',
    'record:delete',
    'dashboard:read',
    'audit:read',
  ],
  ANALYST: ['record:create', 'record:read', 'dashboard:read'],
  VIEWER: ['record:read', 'dashboard:read'],
};
