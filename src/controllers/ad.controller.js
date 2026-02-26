const adService = require('../services/ad.service');

exports.createAd = async (req, res) => {
  try {
    const ad = await adService.createAd(req.user.id, req.body);
    res.status(201).json(ad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMyAds = async (req, res) => {
  try {
    const ads = await adService.getMyAds(req.user.id);
    res.json(ads);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAdDetails = async (req, res) => {
  try {
    const details = await adService.getAdDetails(req.params.id, req.user.id);
    res.json(details);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.pauseAd = async (req, res) => {
  try {
    const ad = await adService.updateAdState(req.params.id, req.user.id, 'PAUSED');
    res.json(ad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.resumeAd = async (req, res) => {
  try {
    const ad = await adService.updateAdState(req.params.id, req.user.id, 'APPROVED'); // Assuming an ad must have been approved to resume.
    res.json(ad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteAd = async (req, res) => {
  try {
    await adService.deleteAdByUser(req.params.id, req.user.id);
    res.json({ success: true, message: 'Ad deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await adService.getDashboardStats(req.user.id);
    res.json(stats);
  } catch (err) {
      res.status(400).json({ error: err.message });
  }
};

exports.getNextAd = async (req, res) => {
  try {
    const { type } = req.query; // COVER_OVERLAY or POWER_VIDEO
    const ad = await adService.getNextAd(type);
    res.json(ad || null);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.trackAdEvent = async (req, res) => {
  try {
    const { adId, type } = req.body; // VIEW or CLICK
    const userId = req.user ? req.user.id : null;
    await adService.trackAdEvent(adId, userId, type);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Admin
exports.getPendingAds = async (req, res) => {
  try {
    const ads = await adService.getPendingAds();
    res.json(ads);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.reviewAd = async (req, res) => {
  try {
    const { status } = req.body;
    const ad = await adService.reviewAd(req.params.id, status);
    res.json(ad);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
