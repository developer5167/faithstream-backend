const streamService = require('../services/stream.service');

exports.getStreamUrl = async (req, res) => {
  const url = await streamService.getStreamUrl(
    req.params.songId,
    req.user.id
  );
  res.json({ url });
};

exports.logStream = async (req, res) => {
  await streamService.logStream(req.body.song_id, req.user.id, req.body.duration);
  res.json({ ok: true });
};
