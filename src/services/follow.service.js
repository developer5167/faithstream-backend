const followRepo = require('../repositories/follow.repo');

class FollowService {
  async followArtist(followerId, artistId) {
    if (followerId === artistId) {
      throw new Error('You cannot follow yourself');
    }
    return await followRepo.follow(followerId, artistId);
  }

  async unfollowArtist(followerId, artistId) {
    return await followRepo.unfollow(followerId, artistId);
  }

  async isFollowing(followerId, artistId) {
    return await followRepo.isFollowing(followerId, artistId);
  }

  async getFollowerCount(artistId) {
    return await followRepo.getFollowerCount(artistId);
  }

  async getTopArtists(limit) {
    return await followRepo.getTopArtistsByFollowers(limit);
  }
}

module.exports = new FollowService();
