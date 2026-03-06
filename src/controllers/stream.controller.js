const streamService = require('../services/stream.service');
const redisClient = require('../config/redis');

exports.getStreamUrl = async (req, res) => {
  const url = await streamService.getStreamUrl(
    req.params.songId,
    req.user.id
  );
  res.json({ url });
};

exports.logStream = async (req, res) => {
  // Flutter sends 'duration_listened' (in seconds)
  const duration = parseInt(req.body.duration_listened ?? req.body.duration ?? 0, 10);
  await streamService.logStream(req.body.song_id, req.user.id, duration);
  res.json({ ok: true });
};

exports.logRecentlyPlayed = async (req, res) => {
  await streamService.logRecentlyPlayed(req.body.song_id, req.user.id);
  res.json({ ok: true });
};

exports.checkPlayLimit = async (req, res) => {
  try {
     const subscriptionRepo = require('../repositories/subscription.repo');
     const streamRepo = require('../repositories/stream.repo');
     
     const hasPremium = await subscriptionRepo.hasActiveSubscription(req.user.id);
     if (hasPremium) {
       return res.json({ canPlay: true });
     }
     
     const songId = req.params.songId;
     const todayStr = new Date().toISOString().split('T')[0];
     const cacheKey = `daily_plays:${req.user.id}:${songId}:${todayStr}`;

     // High Write Cache: Increment Redis counter directly
     // Instead of querying heavy PostgreSQL tables
     let currentPlays = await redisClient.get(cacheKey);
     
     if (currentPlays && parseInt(currentPlays, 10) >= 2) {
       return res.json({ canPlay: false, reason: 'DAILY_LIMIT_REACHED' });
     }
     
     // Note: Once they actually play the song for 30 seconds, 
     // mobile calls /log, which increments this counter via stream.controller.js
     
     res.json({ canPlay: true });
  } catch (error) {
     res.status(400).json({ error: error.message });
  }
};
