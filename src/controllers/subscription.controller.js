const subService = require('../services/subscription.service');

// ── User-facing ───────────────────────────────────────────────────────────────

// Create Razorpay order (for razorpay_flutter plugin checkout)
exports.createOrder = async (req, res) => {
  try {
    const result = await subService.createOrder(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Verify payment after razorpay_flutter success callback
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const result = await subService.verifyPayment(req.user.id, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createPaymentLink = async (req, res) => {
  const result = await subService.createPaymentLink(req.user.id);
  res.json({ success: true, ...result });
};

exports.getStatus = async (req, res) => {
  const status = await subService.getUserSubscription(req.user.id);
  res.json({ success: true, subscription: status });
};

exports.webhook = async (req, res) => {
  // Debug: log what Razorpay is sending so we can diagnose issues
  console.log('[Webhook] Received. Content-Type:', req.headers['content-type']);
  console.log('[Webhook] Signature header:', req.headers['x-razorpay-signature']);
  console.log('[Webhook] Body type:', typeof req.body, 'Is Buffer:', Buffer.isBuffer(req.body));

  try {
    await subService.handleWebhook(req);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Webhook Error]', err.message);
    res.status(400).json({ error: err.message });
  }
};

// ── Admin-facing ──────────────────────────────────────────────────────────────

exports.adminList = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const result = await subService.getAdminList({
    page: parseInt(page),
    limit: parseInt(limit),
    status,
  });
  res.json({ success: true, ...result });
};

exports.adminStats = async (req, res) => {
  const { month } = req.query; // optional: 'YYYY-MM'
  const stats = await subService.getAdminStats(month);
  res.json({ success: true, stats });
};

exports.adminGrant = async (req, res) => {
  const { userId, action } = req.body; // action: 'grant' | 'revoke'
  if (!userId || !action) {
    return res.status(400).json({ error: 'userId and action are required' });
  }
  if (action === 'grant') {
    await subService.grantPremium(userId);
    res.json({ success: true, message: 'Premium granted for 30 days' });
  } else if (action === 'revoke') {
    await subService.revokePremium(userId);
    res.json({ success: true, message: 'Premium revoked' });
  } else {
    res.status(400).json({ error: 'action must be grant or revoke' });
  }
};
