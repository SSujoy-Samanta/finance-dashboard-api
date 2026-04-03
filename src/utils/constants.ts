  /**
 * Enum representing the names of primary entities in the system.
 * Used primarily for audit logging to identify which table/resource was affected.
 */
export enum EntityName {
  USER = 'users',
  FINANCIAL_RECORD = 'financial_records',
  AUDIT_LOG = 'audit_logs',
}

/**
 * Global application configuration defaults.
 */
export const APP_CONFIG = {
  /** Default starting page for paginated results */
  DEFAULT_PAGE: 1,
  /** Default number of items per page for paginated results */
  DEFAULT_LIMIT: 10,
} as const;
