const songRepo = require('../repositories/song.repo');
const streamRepo = require('../repositories/stream.repo');
const recentlyPlayedRepo = require('../repositories/recentlyPlayed.repo');
const s3Util = require('../utils/s3.util');

// In-memory deduplication guard: prevents double-counting within a short window
// Map key: `${userId}:${songId}`, value: timestamp of last stream log
const _recentStreams = new Map();
const DEDUP_WINDOW_MS = 5000; // 5 seconds

exports.getStreamUrl = async (songId, userId) => {
  const song = await songRepo.findApprovedById(songId);

  if (!song) {
    throw new Error('Song not available');
  }

  // audio_processed_url stores S3 key, not public URL
  return s3Util.getSignedUrl(song.audio_processed_url);
};

exports.logStream = async (songId, userId, duration) => {
  // Only count streams that meet the 30-second threshold
  if (!duration || duration < 30) return;

  // Server-side deduplication: ignore rapid repeat calls for same (user, song)
  const dedupKey = `${userId}:${songId}`;
  const lastLogged = _recentStreams.get(dedupKey);
  const now = Date.now();
  if (lastLogged && (now - lastLogged) < DEDUP_WINDOW_MS) {
    console.log(`[stream] Deduplicated: user=${userId} song=${songId}`);
    return;
  }
  _recentStreams.set(dedupKey, now);

  await streamRepo.create(songId, userId, duration);
  console.log(`[stream] Counted: user=${userId} song=${songId} duration=${duration}s`);
};

// Separate endpoint: update recently-played only, no stream count
exports.logRecentlyPlayed = async (songId, userId) => {
  await recentlyPlayedRepo.upsert(userId, songId);
};
