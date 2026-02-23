const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const app = express();
// Trust reverse proxies (ngrok, nginx, etc.) — needed for rate limiting to work correctly
app.set('trust proxy', 1);
app.use(
  cors({
    origin: ["http://localhost:8080", "*"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

/* -------------------- WEBHOOK (must be before express.json!) -------------------- */

// 💳 Webhook — registered FIRST so express.json() never touches this body
// express.raw() captures the raw Buffer needed for HMAC signature verification
app.use(
  "/api/subscriptions/webhook",
  express.raw({ type: "*/*" }),       // capture any content-type as raw Buffer
  require("./routes/subscription.webhook.routes"),
);

/* -------------------- GLOBAL MIDDLEWARE -------------------- */

// Default JSON parser (registered AFTER webhook route)
app.use(express.json());

/* -------------------- RATE LIMITERS -------------------- */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

/* -------------------- ROUTES -------------------- */

// 🔐 Auth
app.use("/api/auth", authLimiter, require("./routes/auth.routes"));

// 🌍 Global rate limit
app.use(limiter);

// Main routes (with /api prefix)
app.use("/api/home", require("./routes/home.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/artist", require("./routes/artist.routes"));
app.use("/api/songs", require("./routes/song.routes"));
app.use("/api/albums", require("./routes/album.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/subscriptions", require("./routes/subscription.routes"));
app.use("/api/stream", require("./routes/stream.routes"));
app.use("/api/payouts", require("./routes/payout.routes"));
app.use("/api/complaints", require("./routes/complaint.routes"));
app.use("/api/support", require("./routes/supportTicket.routes"));
app.use("/api/disputes", require("./routes/dispute.routes"));
app.use("/api/favorites", require("./routes/favorite.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/playlists", require("./routes/playlist.routes"));
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/albums/tracks",require("./routes/tracks.routes"))
app.use("/api/artist/verified", require("./routes/verified_artist.routes"));

/* -------------------- ERROR HANDLER -------------------- */

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
