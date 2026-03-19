const logger = require('../config/logger');

/**
 * Request Logger Middleware
 * Logs every API request with method, URL, status code, response time, and client IP.
 * Automatically flags slow requests (>1000ms) as warnings.
 */
module.exports = (req, res, next) => {
  const start = Date.now();

  // When the response finishes, log the details
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    const logData = {
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip,
    };

    // Add user ID if authenticated
    if (req.user?.id) {
      logData.userId = req.user.id;
    }

    // Choose log level based on status and speed
    if (statusCode >= 500) {
      logger.error(`${method} ${originalUrl} ${statusCode} — ${duration}ms`, logData);
    } else if (statusCode >= 400) {
      logger.warn(`${method} ${originalUrl} ${statusCode} — ${duration}ms`, logData);
    } else if (duration > 1000) {
      // Flag slow requests as warnings even if they succeed
      logger.warn(`⚠️ SLOW ${method} ${originalUrl} ${statusCode} — ${duration}ms`, logData);
    } else {
      logger.info(`${method} ${originalUrl} ${statusCode} — ${duration}ms`, logData);
    }
  });

  next();
};
