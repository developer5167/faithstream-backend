const songRepo = require('../repositories/song.repo');
const streamRepo = require('../repositories/stream.repo');
const recentlyPlayedRepo = require('../repositories/recentlyPlayed.repo');
const s3Util = require('../utils/s3.util');

exports.getStreamUrl = async (songId, userId) => {
  const song = await songRepo.findApprovedById(songId);

  if (!song) {
    throw new Error('Song not available');
  }

  // audio_processed_url stores S3 key, not public URL
  return s3Util.getSignedUrl(song.audio_processed_url);
};

exports.logStream = async (songId, userId, duration) => {
  // Ignore very short plays (anti-fraud)
  if (duration < 30) return;

  await streamRepo.create(songId, userId, duration);
  
  // Track recently played songs
  await recentlyPlayedRepo.upsert(userId, songId);
};
