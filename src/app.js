const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("./config/redis");

const app = express();
// Trust reverse proxy configuration:
// - In PRODUCTION: set TRUSTED_PROXY_IP in .env to your nginx/load balancer IP address.
//   This means ONLY that specific machine is trusted to provide the real client IP via
//   X-Forwarded-For — preventing attackers from spoofing it to bypass rate limiting.
// - In DEVELOPMENT: falls back to `1` (trust first hop) so ngrok/local proxies work.
const trustedProxy = process.env.TRUSTED_PROXY_IP || 1;
app.set('trust proxy', trustedProxy);
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:3000",
      "https://faithstream.admin.sotersystems.in",
      "http://localhost:5173",
      "https://faithstream.sotersystems.in",
      "https://faithstream.ads.sotersystems.in",
      "http://192.168.15.165:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,          // Required: allows browser to send/receive cookies cross-origin
    optionsSuccessStatus: 204,
  }),
);

/* -------------------- OBSERVABILITY -------------------- */
// Request logger — logs every API call. Placed FIRST so webhooks are properly logged.
const requestLogger = require("./middlewares/requestLogger");
app.use(requestLogger);

/* -------------------- WEBHOOK (must be before express.json!) -------------------- */

// 💳 Webhook — registered FIRST so express.json() never touches this body
// express.raw() captures the raw Buffer needed for HMAC signature verification
app.use(
  "/api/subscriptions/webhook",
  express.raw({ type: "*/*" }),       // capture any content-type as raw Buffer
  require("./routes/subscription.webhook.routes"),
);

/* -------------------- GLOBAL MIDDLEWARE -------------------- */

// Security headers
app.use(helmet());

// Cookie parser — required to read HttpOnly cookies in middleware
app.use(cookieParser());

// Default JSON parser with size limit (registered AFTER webhook route)
app.use(express.json({ limit: '1mb' }));

/* -------------------- OBSERVABILITY -------------------- */

// Active user tracker — sets a Redis key per authenticated user (5 min TTL)
const activeUsers = require("./middlewares/activeUsers");
app.use(activeUsers);

/* -------------------- RATE LIMITERS -------------------- */

const { strictLimiter, looseLimiter, contentLimiter, adminLimiter } = require("./middlewares/rateLimiter");

/* -------------------- ROUTES -------------------- */

// 🔐 Auth
app.use("/api/auth", strictLimiter, require("./routes/auth.routes"));
app.use("/api/advertiser-auth", strictLimiter, require("./routes/advertiser_auth.routes"));

// Removing generic `app.use(globalLimiter)` which restricted safe routes needlessly
// Instead, adding looseLimiter only where high traffic usually lives

// Main routes (with /api prefix)
app.use("/api/home",        looseLimiter,   require("./routes/home.routes"));
app.use("/api/search",      looseLimiter,   require("./routes/search.routes"));
app.use("/api/users",       looseLimiter,   require("./routes/user.routes"));
app.use("/api/artist",      contentLimiter, require("./routes/artist.routes"));
app.use("/api/artists",     contentLimiter, require("./routes/artist.routes"));
app.use("/api/songs",       contentLimiter, require("./routes/song.routes"));
app.use("/api/albums",      contentLimiter, require("./routes/album.routes"));
app.use("/api/admin",       adminLimiter,   require("./routes/admin.routes"));
app.use("/api/subscriptions", contentLimiter, require("./routes/subscription.routes"));
app.use("/api/stream",      looseLimiter,   require("./routes/stream.routes"));
app.use("/api/payouts",     adminLimiter,   require("./routes/payout.routes"));
app.use("/api/complaints",  contentLimiter, require("./routes/complaint.routes"));
app.use("/api/support",     contentLimiter, require("./routes/supportTicket.routes"));
app.use("/api/disputes",    adminLimiter,   require("./routes/dispute.routes"));
app.use("/api/favorites",   contentLimiter, require("./routes/favorite.routes"));
app.use("/api/notifications", contentLimiter, require("./routes/notification.routes"));
app.use("/api/notification",  contentLimiter, require("./routes/notification.routes"));
app.use("/api/library",     contentLimiter, require("./routes/library.routes"));
app.use("/api/playlists",   contentLimiter, require("./routes/playlist.routes"));
app.use("/api/upload",      contentLimiter, require("./routes/upload.routes"));
app.use("/api/albums/tracks", contentLimiter, require("./routes/tracks.routes"));
app.use("/api/artist/verified", contentLimiter, require("./routes/verified_artist.routes"));
app.use("/api/follow",      contentLimiter, require("./routes/follow.routes"));
app.use("/api/share",       looseLimiter,   require("./routes/redirect.routes"));
app.use("/api/ads",         looseLimiter,   require("./routes/ad.routes"));
app.use("/api/wallet",      contentLimiter, require("./routes/wallet.routes"));
app.use("/api/app",         looseLimiter,   require("./routes/app.routes"));
app.use("/api/song-suggestions", contentLimiter, require("./routes/songSuggestion.routes"));

// 🏥 Health check (no rate limiter — must always be reachable for uptime monitors)
app.use("/api/health", require("./routes/health.routes"));

/* -------------------- BACKGROUND WORKERS -------------------- */
const streamBatchWorker = require('./workers/streamBatchWorker');
streamBatchWorker.start();
// const ffmpegWorker = require('./workers/ffmpegWorker');
// ffmpegWorker.start(); // FFMPEG worker runs on a separate dedicated Render server

/* -------------------- ERROR HANDLER -------------------- */

const logger = require("./config/logger");

app.use((err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
