const homeService = require('../services/home.service');

exports.getHomeFeed = async (req, res) => {
  // Pass userId if user is authenticated (from auth middleware)
  const userId = req.user?.id || null;
  const feed = await homeService.getHomeFeed(userId);
  res.json(feed);
};
