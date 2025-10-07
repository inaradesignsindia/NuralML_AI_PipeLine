const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// WebSocket connection rate limiter
const wsConnectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 WebSocket connections per minute
  message: 'Too many WebSocket connections from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for WebSocket upgrade requests from allowed origins
    return req.headers.upgrade === 'websocket' && req.headers.origin === 'http://localhost:3000';
  }
});

// Subscription rate limiter for WebSocket messages
class WebSocketRateLimiter {
  constructor() {
    this.subscriptions = new Map(); // socketId -> { count, resetTime }
    this.maxSubscriptionsPerMinute = 5; // Max 5 subscriptions per minute per socket
    this.windowMs = 60 * 1000; // 1 minute window
  }

  canSubscribe(socketId) {
    const now = Date.now();
    const userLimit = this.subscriptions.get(socketId);

    if (!userLimit) {
      this.subscriptions.set(socketId, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (now > userLimit.resetTime) {
      // Reset window
      this.subscriptions.set(socketId, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (userLimit.count >= this.maxSubscriptionsPerMinute) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [socketId, limit] of this.subscriptions.entries()) {
      if (now > limit.resetTime) {
        this.subscriptions.delete(socketId);
      }
    }
  }
}

const wsRateLimiter = new WebSocketRateLimiter();

// Clean up rate limiter data every 5 minutes
setInterval(() => {
  wsRateLimiter.cleanup();
}, 5 * 60 * 1000);

module.exports = {
  apiLimiter,
  strictLimiter,
  wsConnectionLimiter,
  wsRateLimiter,
};