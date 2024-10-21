const rateLimit = require("express-rate-limit");

const createRateLimiter = (options = {}) => {
  // Limit to 100 req per 5 min.
  const defaultOptions = {
    windowMs: 5 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return rateLimit(mergedOptions);
};

// General API rate limiting
const apiLimiter = createRateLimiter();

// Stricter middleware for auth routes
const authLimiter = createRateLimiter({
  // Limit to 10 req per 60 min
  windowMs: 60 * 60 * 1000,
  max: 10,
  message:
    "Too many login attempts from this IP, please try again after an hour",
});

module.exports = { apiLimiter, authLimiter, createRateLimiter };
