const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:8080", "*"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

/* -------------------- GLOBAL MIDDLEWARE -------------------- */

// Default JSON parser
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

// 💳 Webhook (override body parser)
app.use(
  "/api/subscriptions/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/subscription.webhook.routes"),
);

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
app.use("/api/complaints", require("./routes/complaint.routes"));
app.use("/api/support", require("./routes/supportTicket.routes"));
app.use("/api/disputes", require("./routes/dispute.routes"));
app.use("/api/favorites", require("./routes/favorite.routes"));
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
