const albumRepo = require('../repositories/album.repo');
const songRepo = require('../repositories/song.repo');
const artistRepo = require('../repositories/artist.repo');
const recentlyPlayedRepo = require('../repositories/recentlyPlayed.repo');
const followRepo = require('../repositories/follow.repo');

exports.getHomeFeed = async (userId = null) => {
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

  return feed;
};
