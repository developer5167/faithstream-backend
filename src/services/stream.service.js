const songRepo = require('../repositories/song.repo');
const streamRepo = require('../repositories/stream.repo');
const recentlyPlayedRepo = require('../repositories/recentlyPlayed.repo');
const s3Util = require('../utils/s3.util');
const redisClient = require('../config/redis');
const jwt = require('jsonwebtoken');

const DEDUP_WINDOW_MS = 5000; // 5 seconds

exports.getStreamUrl = async (songId, userId) => {
  const song = await songRepo.findApprovedById(songId);

  if (!song) {
    throw new Error('Song not available');
  }

  // Check subscription and enforce daily free limit
  const subscriptionRepo = require('../repositories/subscription.repo');
  const hasPremium = await subscriptionRepo.hasActiveSubscription(userId);
  
  if (!hasPremium) {
     const todayStr = new Date().toISOString().split('T')[0];
     const cacheKey = `daily_plays:${userId}:${songId}:${todayStr}`;
     
     let currentPlays = await redisClient.get(cacheKey);
     if (currentPlays && parseInt(currentPlays, 10) >= 2) {
       throw new Error('DAILY_LIMIT_REACHED');
     }
  }

  if (song.audio_processed_url && song.audio_processed_url.endsWith('.m3u8')) {
     const token = jwt.sign({ id: userId, purpose: 'hls' }, process.env.JWT_SECRET, { expiresIn: '6h' });
     const appUrl = process.env.APP_URL || process.env.VITE_API_URL || 'http://localhost:9000';
     return `${appUrl}/api/stream/${song.id}/hls.m3u8?token=${token}`;
  }

  // audio_processed_url stores S3 key, not public URL for legacy files
  return s3Util.getSignedUrl(song.audio_processed_url);
};

exports.getHlsPlaylist = async (songId, userId) => {
  const song = await songRepo.findApprovedById(songId);
  if (!song || !song.audio_processed_url) throw new Error('Song unavailable');

  const m3u8Raw = await s3Util.getObjectAsString(song.audio_processed_url);
  
  // The M3U8 has lines like "segment_000.ts"
  // We need to replace each .ts with a fully signed S3 url.
  const lines = m3u8Raw.split('\n');
  const basePath = song.audio_processed_url.substring(0, song.audio_processed_url.lastIndexOf('/') + 1);

  const signedLines = lines.map(line => {
    if (line.trim().endsWith('.ts')) {
       return s3Util.getSignedUrl(basePath + line.trim());
    }
    return line;
  });

  return signedLines.join('\n');
};

exports.logStream = async (songId, userId, duration) => {
  // Only count streams that meet the 30-second threshold
  if (!duration || duration < 30) return;

  // Server-side deduplication: use Redis lock with PX (milliseconds expiration)
  const dedupKey = `stream_dedup:${userId}:${songId}`;
  
  // SET NX ensures it only sets the key if it doesn't already exist. Returns null if exists.
  const acquired = await redisClient.set(dedupKey, '1', {
    NX: true,
    PX: DEDUP_WINDOW_MS
  });

  if (!acquired) {
    console.log(`[stream] Deduplicated (Redis target): user=${userId} song=${songId}`);
    return;
  }

  await streamRepo.create(songId, userId, duration);
  
  // Increment Daily Limit Counter in Redis natively
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyKey = `daily_plays:${userId}:${songId}:${todayStr}`;
  await redisClient.incr(dailyKey);
  
  // Set to expire at midnight to save RAM
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  await redisClient.expireAt(dailyKey, Math.floor(nextMidnight.getTime() / 1000));

  console.log(`[stream] Counted: user=${userId} song=${songId} duration=${duration}s`);
};

// Separate endpoint: update recently-played only, no stream count
exports.logRecentlyPlayed = async (songId, userId) => {
  await recentlyPlayedRepo.upsert(userId, songId);
};
