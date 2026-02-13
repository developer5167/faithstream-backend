const albumRepo = require('../repositories/album.repo');
const songRepo = require('../repositories/song.repo');
const artistRepo = require('../repositories/artist.repo');
const recentlyPlayedRepo = require('../repositories/recentlyPlayed.repo');

exports.getHomeFeed = async (userId = null) => {
  // Fetch recent/featured content in parallel
  const promises = [
    albumRepo.getRecentApproved(10),
    songRepo.getPopularSongs(20),
    artistRepo.getFeaturedArtists(10),
  ];

  // Add recently played if user is authenticated
  if (userId) {
    promises.push(recentlyPlayedRepo.getRecentlyPlayed(userId, 10));
  }

  const results = await Promise.all(promises);

  const feed = {
    albums: results[0],
    songs: results[1],
    artists: results[2],
    recentlyPlayed:results[3] || [],
  };

  // Add recently played if available
  if (userId) {
    feed.recentlyPlayed = results[3];
  }

  return feed;
};
