const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis");

const createRedisStore = () => {
  return new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  });
};

// Extremely Strict: For Login, Register, OTP
exports.strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per 5 minutes
  message: { error: "Too many sensitive requests from this IP, please try again after 5 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
});

// Medium: For Uploads (Images/Songs)
exports.uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: { error: "Too many uploads from this IP, please try again after a minute" },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
});

// Loose: For High-Traffic Streams & Feed Data
exports.looseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: "Streaming rate limit exceeded, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
});
