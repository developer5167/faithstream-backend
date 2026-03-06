const albumRepo = require('../repositories/album.repo');
const songRepo = require('../repositories/song.repo');
const artistRepo = require('../repositories/artist.repo');
const recentlyPlayedRepo = require('../repositories/recentlyPlayed.repo');
const followRepo = require('../repositories/follow.repo');
const redisClient = require('../config/redis');

exports.getHomeFeed = async (userId = null) => {
  const cacheKey = `home_feed_${userId || 'guest'}`;

  // 1. Check Redis Cache
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData); // Return instantly if cached
    }
  } catch (err) {
    console.error('[Redis] Home feed cache get error:', err.message);
  }

  // 2. Cache Miss - Fetch from Database
  // Fetch generic content in parallel
  const promises = [
    albumRepo.getRecentApproved(10),
    songRepo.getPopularSongs(10), // Trending (30 days)
    songRepo.getTopPlayedSongs(10), // Most Played (All-time)
    followRepo.getTopArtistsByFollowers(10), // Trending Artists
    artistRepo.getTopArtistsByStreams(10), // Most Played Artists
  ];

  // Add user-specific content if authenticated
  if (userId) {
    promises.push(recentlyPlayedRepo.getRecentlyPlayed(userId, 10));
    promises.push(followRepo.getFollowedArtists(userId, 10));
  }

  const results = await Promise.all(promises);

  const feed = {
    albums: results[0],
    trending_songs: results[1],
    top_played_songs: results[2],
    top_artists: results[3],
    top_played_artists: results[4],
    recentlyPlayed: userId ? results[5] : [],
    followed_artists: userId ? results[6] : [],
  };

  // 3. Save to Redis Cache (5 minutes = 300 seconds)
  try {
    await redisClient.set(cacheKey, JSON.stringify(feed), { EX: 300 });
  } catch (err) {
    console.error('[Redis] Home feed cache set error:', err.message);
  }

  return feed;
};
