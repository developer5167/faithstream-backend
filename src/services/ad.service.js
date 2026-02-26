const adRepo = require('../repositories/ad.repo');

exports.createAd = async (userId, data) => {
  const newAd = await adRepo.create({
    ...data,
    advertiser_id: userId,
    status: 'PENDING',
    daily_budget_limit: data.daily_budget_limit || 500
  });
  return newAd;
};

exports.getMyAds = async (userId) => {
  return await adRepo.findForUser(userId);
};

exports.getAdDetails = async (adId, userId) => {
  // Returns ad metadata along with analytics
  const details = await adRepo.findByIdAndUser(adId, userId);
  if (!details) throw new Error('Ad not found');
  
  const analytics = await adRepo.getAdAnalyticsByDate(adId);
  return { ...details, analytics };
};

exports.updateAdState = async (adId, userId, newState) => {
  if (!['PAUSED', 'APPROVED'].includes(newState)) {
    throw new Error('Invalid state transition');
  }
  const ad = await adRepo.findByIdAndUser(adId, userId);
  if (!ad) throw new Error('Ad not found');
  
  if (newState === 'APPROVED' && ad.status === 'REJECTED') {
      throw new Error('Cannot resume a rejected ad');
  }

  return await adRepo.updateStatus(adId, newState);
};

exports.deleteAdByUser = async (adId, userId) => {
  const ad = await adRepo.findByIdAndUser(adId, userId);
  if (!ad) throw new Error('Ad not found');
  return await adRepo.updateStatus(adId, 'DELETED');
};

exports.getDashboardStats = async (userId) => {
  return await adRepo.getAdvertiserDashboard(userId);
}

exports.getNextAd = async (adType) => { 
  return await adRepo.getNextAd(adType);
};

exports.trackAdEvent = async (adId, userId, eventType) => {
  await adRepo.trackEvent(adId, userId, eventType);
};

exports.reviewAd = async (adId, status) => {
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid status');
  }
  return await adRepo.updateStatus(adId, status);
};

exports.getPendingAds = async () => {
  return await adRepo.getPending();
};
