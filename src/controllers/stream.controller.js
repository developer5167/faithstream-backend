const streamService = require('../services/stream.service');

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
     const count = await streamRepo.getDailyPlayCount(req.user.id, songId);
     if (count >= 2) {
       return res.json({ canPlay: false, reason: 'DAILY_LIMIT_REACHED' });
     }
     
     res.json({ canPlay: true });
  } catch (error) {
     res.status(400).json({ error: error.message });
  }
};
