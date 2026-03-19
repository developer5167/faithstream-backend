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

// Loose: For High-Traffic Streams & Feed Data (100 req/min)
exports.looseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Streaming rate limit exceeded, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
});

// Content: For song/album/playlist browsing — generous enough that real users never hit it
// 200 req/min = ~3 requests/sec. A real user browsing the app makes ~10-20/min.
// Only bots hammering the API at script-speed will be blocked.
exports.contentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute per IP
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
});

// Admin: For the admin panel — stricter to slow down enumeration attacks
// 30 req/min is plenty for a human admin doing their job.
exports.adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: { error: "Admin rate limit exceeded, please try again shortly" },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
});
