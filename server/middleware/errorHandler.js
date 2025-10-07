const logger = require('../logger');

/**
 * Enhanced error handling middleware with graceful degradation
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, status: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, status: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, status: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, status: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, status: 401 };
  }

  // API rate limit errors
  if (err.message && err.message.includes('rate limit')) {
    error = { message: 'Too many requests, please try again later', status: 429 };
  }

  // External API errors - graceful degradation
  if (err.message && (err.message.includes('API error') || err.message.includes('timeout'))) {
    error = {
      message: 'Service temporarily unavailable, using cached data',
      status: 503,
      degraded: true
    };
  }

  // Default error
  const statusCode = error.status || 500;
  const message = error.message || 'Internal Server Error';

  // Send appropriate response
  if (req.accepts('json')) {
    res.status(statusCode).json({
      success: false,
      error: message,
      ...(error.degraded && { degraded: true }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    // HTML response for non-API routes
    res.status(statusCode).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error ${statusCode}</h1>
          <p>${message}</p>
          ${error.degraded ? '<p><em>Service operating in degraded mode</em></p>' : ''}
        </body>
      </html>
    `);
  }
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Graceful degradation middleware
 */
const gracefulDegradation = (req, res, next) => {
  // Add helper methods to response for graceful degradation
  res.gracefulResponse = (data, fallbackData = null, options = {}) => {
    const { status = 200, message = 'Success' } = options;

    if (data) {
      res.status(status).json({
        success: true,
        data,
        message
      });
    } else if (fallbackData) {
      res.status(206).json({ // 206 Partial Content
        success: true,
        data: fallbackData,
        message: 'Using cached/fallback data',
        degraded: true
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        degraded: true
      });
    }
  };

  next();
};

/**
 * Circuit breaker middleware for external services
 */
class CircuitBreaker {
  constructor(failureThreshold = 5, recoveryTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn, fallbackFn = null) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        if (fallbackFn) {
          logger.warn('Circuit breaker OPEN, using fallback');
          return await fallbackFn();
        }
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallbackFn && this.state === 'OPEN') {
        logger.warn('Circuit breaker OPEN after failure, using fallback');
        return await fallbackFn();
      }
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker opened after ${this.failureCount} failures`);
    }
  }
}

// Export middleware functions
module.exports = {
  errorHandler,
  asyncHandler,
  gracefulDegradation,
  CircuitBreaker
};