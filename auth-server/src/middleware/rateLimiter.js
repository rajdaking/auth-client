const rateLimit = require('express-rate-limit');

// General auth limiter applies to all auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 requests per 15 mins
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,     // returns rate limit info in headers
  legacyHeaders: false,
});

// Strict limiter for login and register only
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // max 5 attempts per 15 mins
  message: { error: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, loginLimiter };