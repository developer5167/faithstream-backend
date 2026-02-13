const subService = require('../services/subscription.service');

exports.createSubscription = async (req, res) => {
  const sub = await subService.createRazorpaySubscription(req.user.id);
  res.json(sub);
};

exports.getStatus = async (req, res) => {
  const status = await subService.getUserSubscription(req.user.id);
  res.json(status);
};

exports.webhook = async (req, res) => {
  await subService.handleWebhook(req);
  res.json({ ok: true });
};
