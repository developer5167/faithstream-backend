const redisClient = require('../config/redis');

/**
 * Active Users Middleware
 * On every authenticated request, sets a Redis key with a 5-minute TTL.
 * The health endpoint can then count these keys to report real-time active users.
 * 
 * Performance: single Redis SET with TTL per request (~0.1ms)
 */
module.exports = (req, res, next) => {
  // Only track authenticated users (req.user is set by auth middleware)
  if (req.user?.id) {
    const key = `active_user:${req.user.id}`;
    // Fire-and-forget: don't await, don't block the request
    redisClient.setEx(key, 300, '1').catch(() => {
      // Silently ignore — this is non-critical telemetry
    });
  }
  next();
};
