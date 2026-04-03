/**
 * Custom application error class that extends the native Error.
 * used throughout the application to throw operational errors with specific 
 * HTTP status codes and technical error codes.
 */
export class AppError extends Error {
  /** The HTTP status code associated with the error (e.g., 404, 401) */
  public readonly statusCode: number;
  /** A unique technical string identifying the error type (e.g., 'USER_NOT_FOUND') */
  public readonly code: string;
  /** 
   * Flag indicating if the error is operational (expected) or a 
   * programming/system error. Used by the error handler to decide 
   * how much detail to reveal.
   */
  public readonly isOperational: boolean;

  /**
   * Creates an instance of AppError.
   * 
   * @param {string} message - The human-readable error message.
   * @param {number} statusCode - The HTTP status code.
   * @param {string} code - The technical error code.
   * @param {boolean} [isOperational=true] - Whether the error is a known operational issue.
   */
  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
