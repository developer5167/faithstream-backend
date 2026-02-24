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
