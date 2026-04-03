/**
 * Standard pagination metadata for collection responses.
 */
export interface PaginationMeta {
  /** The current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items available across all pages */
  total: number;
  /** Calculated total number of pages */
  totalPages: number;
  /** Indicates if there is a subsequent page */
  hasNextPage: boolean;
  /** Indicates if there is a preceding page */
  hasPrevPage: boolean;
}

/**
 * Centralized utility for constructing consistent API response objects.
 * Wraps success data or error details into a standard JSON structure.
 * 
 * @template T - The type of the data being wrapped.
 */
export class ApiResponse<T> {
  /** Indicates if the operation was successful */
  public readonly success: boolean = true;
  /** The payload of the response */
  public readonly data: T;
  /** Optional descriptive message */
  public readonly message?: string;
  /** Optional pagination information for collection-based data */
  public readonly meta?: PaginationMeta;

  constructor(data: T, message?: string, meta?: PaginationMeta) {
    this.success = true;
    this.data = data;
    this.message = message;
    this.meta = meta;
  }

  /**
   * Static helper to create a successful ApiResponse.
   * 
   * @param {T} data - The primary data to return.
   * @param {string} [message] - An optional success message.
   * @param {PaginationMeta} [meta] - Optional pagination metadata.
   * @returns {ApiResponse<T>}
   */
  static success<T>(data: T, message?: string, meta?: PaginationMeta) {
    return new ApiResponse(data, message, meta);
  }

  /**
   * Static helper to create a standardized error response object.
   * 
   * @param {string} message - The error message.
   * @param {string} code - A technical error code (e.g., 'VALIDATION_ERROR').
   * @param {Record<string, unknown> | unknown} [details] - Optional extra details (e.g., validation field errors).
   * @returns {Object} - A non-success response structure.
   */
  static error(message: string, code: string, details?: Record<string, unknown> | unknown) {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
    };
  }
}
