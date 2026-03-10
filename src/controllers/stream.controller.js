const streamService = require('../services/stream.service');
const redisClient = require('../config/redis');

exports.getStreamUrl = async (req, res) => {
  const url = await streamService.getStreamUrl(
    req.params.songId,
    req.user.id
  );
  res.json({ url });
};

exports.getHlsPlaylist = async (req, res) => {
  try {
    const { songId } = req.params;
    const { token } = req.query;

    if (!token) return res.status(401).json({ error: 'Missing playback token' });

    // Validate token manually (allows flutter to play via query param natively)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== 'hls') {
      return res.status(401).json({ error: 'Invalid playback token' });
    }

    const m3u8Content = await streamService.getHlsPlaylist(songId, decoded.id);
    
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(m3u8Content);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.logStream = async (req, res) => {
  try {
    // Flutter sends 'duration_listened' (in seconds)
    const duration = parseInt(req.body.duration_listened ?? req.body.duration ?? 0, 10);
    const songId = req.body.song_id;
    const userId = req.user.id;
    
    if (!songId || !userId) {
       return res.status(400).json({ error: 'Missing required fields' });
    }

    // High Write Traffic Optimization (Phase 2)
    // Instead of invoking `streamService.logStream` which executes a heavy 
    // persistent PostgreSQL `INSERT` on the main thread, we enqueue it into
    // RAM instantly via Redis. A background cron job will flush the queue 
    // every 10 seconds.
    const payload = JSON.stringify({
      songId,
      userId,
      duration,
      timestamp: Date.now()
    });

    await redisClient.rPush('stream_analytics_queue', payload);

    // INSTANTLY increment the 2-play daily limit cache so the user can't 
    // bypass the limit by playing songs rapidly before the 10s worker runs.
    if (duration >= 30) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyKey = `daily_plays:${userId}:${songId}:${todayStr}`;
        await redisClient.incr(dailyKey);
        
        // Ensure midnight expiry
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        await redisClient.expireAt(dailyKey, Math.floor(nextMidnight.getTime() / 1000));
      } catch (err) {
        console.error('Instant Redis limit increment error:', err);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Redis RPUSH stream error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
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
