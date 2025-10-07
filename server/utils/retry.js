const logger = require('../logger');

/**
 * Retry utility with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000, // 1 second
    maxDelay = 30000, // 30 seconds
    backoffFactor = 2,
    retryCondition = () => true, // Function to determine if error should be retried
    onRetry = null // Callback before retry
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!retryCondition(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);

      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Default retry condition for common API errors
 */
function isRetryableError(error) {
  // Retry on network errors, timeouts, 5xx errors
  if (error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message.includes('timeout') ||
      error.message.includes('network')) {
    return true;
  }

  // Retry on 5xx HTTP status codes
  if (error.response && error.response.status >= 500) {
    return true;
  }

  // Retry on rate limiting (429)
  if (error.response && error.response.status === 429) {
    return true;
  }

  return false;
}

/**
 * Circuit breaker enhanced retry
 */
class RetryWithCircuitBreaker {
  constructor(circuitBreaker, retryOptions = {}) {
    this.circuitBreaker = circuitBreaker;
    this.retryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      ...retryOptions
    };
  }

  async execute(fn, fallbackFn = null) {
    return this.circuitBreaker.execute(
      () => retryWithBackoff(fn, this.retryOptions),
      fallbackFn
    );
  }
}

module.exports = {
  retryWithBackoff,
  isRetryableError,
  RetryWithCircuitBreaker
};