const subRepo = require('../repositories/subscription.repo');

module.exports = async (req, res, next) => {
  const active = await subRepo.hasActiveSubscription(req.user.id);
  if (!active) {
    return res.status(403).json({ error: 'Subscription required' });
  }
  next();
};
