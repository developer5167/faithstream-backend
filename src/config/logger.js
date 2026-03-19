const { createLogger, format, transports } = require('winston');
const path = require('path');

// Try to load DailyRotateFile for production log rotation
let DailyRotateFile;
try {
  DailyRotateFile = require('winston-daily-rotate-file');
} catch {
  // Not installed — skip file rotation (dev-only scenario)
}

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format: [2026-03-19 15:30:00] INFO: Server started on port 9000
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${stack || message}${metaStr}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Capture stack traces
    logFormat
  ),
  defaultMeta: { service: 'faithstream-api' },
  transports: [
    // Always log to console
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      ),
    }),
  ],
});

// In production, also write to rotating log files
if (process.env.NODE_ENV === 'production' && DailyRotateFile) {
  const logsDir = path.join(__dirname, '../../logs');

  // Combined log (all levels)
  logger.add(new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Keep 14 days of logs
  }));

  // Error log (errors only)
  logger.add(new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d', // Keep 30 days of error logs
  }));
}

module.exports = logger;
