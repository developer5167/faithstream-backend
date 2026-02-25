const followService = require('../services/follow.service');

exports.followArtist = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { artistId } = req.params;
    await followService.followArtist(followerId, artistId);
    res.json({ message: 'Followed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unfollowArtist = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { artistId } = req.params;
    await followService.unfollowArtist(followerId, artistId);
    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkFollowing = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { artistId } = req.params;
    const isFollowing = await followService.isFollowing(followerId, artistId);
    res.json({ isFollowing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopArtists = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topArtists = await followService.getTopArtists(limit);
    res.json(topArtists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
