import { logActivity } from './activityLoggerMiddleware.js';

/**
 * Sanitizes error objects to prevent sensitive data leakage
 * @param {Error} error - The error object to sanitize
 * @returns {Object} - Sanitized error object
 */
const sanitizeError = (error) => {
  const sanitized = {
    message: error.message || 'An unexpected error occurred',
    name: error.name || 'Error',
    statusCode: error.statusCode || error.status || 500,
  };

  // Remove sensitive fields if they exist
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey', 'databaseUrl', 'connectionString'];
  for (const field of sensitiveFields) {
    if (error[field]) {
      delete error[field];
    }
  }

  // Add stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    sanitized.stack = error.stack;
  }

  return sanitized;
};

/**
 * Logs errors with appropriate level and context
 * @param {Error} error - The error to log
 * @param {Object} req - Express request object
 * @param {string} context - Additional context about where the error occurred
 */
const logError = (error, req, context = '') => {
  const sanitizedError = sanitizeError(error);
  const logData = {
    message: sanitizedError.message,
    name: sanitizedError.name,
    statusCode: sanitizedError.statusCode,
    url: req?.originalUrl,
    method: req?.method,
    userId: req?.user?.id,
    userAgent: req?.get('User-Agent'),
    ip: req?.ip,
    context,
  };

  // Log to console with structured format
  console.error(`[${new Date().toISOString()}] ERROR:`, JSON.stringify(logData, null, 2));

  // Log to activity system if available
  try {
    logActivity('error_occurred', `Error: ${sanitizedError.message}`, req?.user?.id, {
      error: sanitizedError,
      context,
      url: req?.originalUrl,
      method: req?.method,
    });
  } catch (logError) {
    console.error('Failed to log error to activity system:', logError.message);
  }
};

/**
 * Creates a consistent error response format
 * @param {Error} error - The error object
 * @param {boolean} includeDetails - Whether to include error details in response
 * @returns {Object} - Standardized error response
 */
const createErrorResponse = (error, includeDetails = false) => {
  const sanitizedError = sanitizeError(error);
  const response = {
    success: false,
    error: {
      message: sanitizedError.message,
      code: sanitizedError.name.toUpperCase().replace(/\s+/g, '_'),
      timestamp: new Date().toISOString(),
    },
  };

  // Include additional details in development or for specific error types
  if (includeDetails || process.env.NODE_ENV === 'development') {
    response.error.details = sanitizedError;
  }

  return response;
};

/**
 * Global error handling middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logError(err, req, 'Global error handler');

  // Determine if we should include error details in response
  const includeDetails = process.env.NODE_ENV === 'development' || err.statusCode < 500;

  // Create standardized error response
  const errorResponse = createErrorResponse(err, includeDetails);

  // Set appropriate status code
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for controllers and middleware
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Wrapped function with error handling
 */
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Log the error before passing to next
      logError(error, req, 'Async error wrapper');
      next(error);
    });
  };
};

/**
 * Validation error handler for Zod and other validation libraries
 * @param {Error} error - The validation error
 * @param {Object} req - Express request object
 * @returns {Error} - Formatted validation error
 */
export const handleValidationError = (error, req) => {
  const validationError = new Error('Validation failed');
  validationError.statusCode = 400;
  validationError.name = 'ValidationError';
  validationError.details = error.errors || error.message;
  validationError.originalError = error;

  // Log validation error
  logError(validationError, req, 'Validation error');

  return validationError;
};

/**
 * Database error handler
 * @param {Error} error - The database error
 * @param {Object} req - Express request object
 * @returns {Error} - Formatted database error
 */
export const handleDatabaseError = (error, req) => {
  let message = 'Database operation failed';
  let statusCode = 500;

  // Handle specific database errors
  if (error.code === 'P2002') {
    message = 'A record with this information already exists';
    statusCode = 409;
  } else if (error.code === 'P2025') {
    message = 'Record not found';
    statusCode = 404;
  } else if (error.code?.startsWith('P')) {
    message = 'Database constraint violation';
    statusCode = 400;
  }

  const dbError = new Error(message);
  dbError.statusCode = statusCode;
  dbError.name = 'DatabaseError';
  dbError.originalError = error;

  // Log database error
  logError(dbError, req, 'Database error');

  return dbError;
};

/**
 * Authentication error handler
 * @param {Error} error - The auth error
 * @param {Object} req - Express request object
 * @returns {Error} - Formatted auth error
 */
export const handleAuthError = (error, req) => {
  const authError = new Error(error.message || 'Authentication failed');
  authError.statusCode = error.statusCode || 401;
  authError.name = 'AuthenticationError';
  authError.originalError = error;

  // Log auth error
  logError(authError, req, 'Authentication error');

  return authError;
};

export { sanitizeError, logError, createErrorResponse };