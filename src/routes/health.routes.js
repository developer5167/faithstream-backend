const router = require('express').Router();
const db = require('../config/db');
const redisClient = require('../config/redis');

const startTime = Date.now();

/**
 * GET /api/health
 * Returns system health status: DB, Redis, uptime, memory, active users.
 * Use with UptimeRobot / Better Uptime to get alerts when anything goes down.
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(Date.now() - startTime),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {},
    memory: {},
  };

  // --- Database Check ---
  try {
    const dbStart = Date.now();
    await db.query('SELECT 1');
    health.checks.database = {
      status: 'up',
      responseTime: `${Date.now() - dbStart}ms`,
    };
  } catch (err) {
    health.status = 'degraded';
    health.checks.database = {
      status: 'down',
      error: err.message,
    };
  }

  // --- Redis Check ---
  try {
    const redisStart = Date.now();
    await redisClient.ping();
    health.checks.redis = {
      status: 'up',
      responseTime: `${Date.now() - redisStart}ms`,
    };
  } catch (err) {
    health.status = 'degraded';
    health.checks.redis = {
      status: 'down',
      error: err.message,
    };
  }

  // --- Active Users (from Redis keys) ---
  try {
    const keys = await redisClient.keys('active_user:*');
    health.activeUsers = keys.length;
  } catch {
    health.activeUsers = -1; // Unknown
  }

  // --- Memory Usage ---
  const mem = process.memoryUsage();
  health.memory = {
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
  };

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Format milliseconds into a human-readable uptime string
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

module.exports = router;
