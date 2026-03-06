const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();
const subRepo = require('../repositories/subscription.repo');
const notificationService = require('./notification.service');

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET      = process.env.RAZORPAY_WEBHOOK_SECRET;
const PREMIUM_AMOUNT      = parseInt(process.env.RAZORPAY_PREMIUM_AMOUNT || '9900'); // paise
const APP_BASE_URL        = process.env.APP_BASE_URL || 'https://faithstream.app';

// ── Create a Razorpay Order (for razorpay_flutter plugin) ───────────────────

exports.createOrder = async (userId) => {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      'https://api.razorpay.com/v1/orders',
      {
        amount: PREMIUM_AMOUNT,
        currency: 'INR',
        receipt: `sub_${userId.slice(0, 8)}_${Date.now()}`,
        notes: { user_id: userId, plan: 'PREMIUM' },
      },
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    return {
      order_id: response.data.id,
      amount: PREMIUM_AMOUNT,
      currency: 'INR',
      key_id: RAZORPAY_KEY_ID,
    };
  } catch (err) {
    console.error('[Subscription] createOrder failed:', err.response?.data || err.message);
    throw new Error('Failed to create payment order');
  }
};

// ── Verify payment & activate subscription ────────────────────────────────────

exports.verifyPayment = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  // Verify HMAC signature (constant-time comparison to prevent timing attacks)
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const sigValid = expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(razorpay_signature, 'hex'));
  if (!sigValid) {
    throw new Error('Payment verification failed — invalid signature');
  }

  await subRepo.activateByPaymentId(userId, razorpay_payment_id, PREMIUM_AMOUNT / 100);
  console.log(`[Subscription] Verified & activated PREMIUM for user ${userId}`);
  
  // Notify user
  notificationService.sendToUser(
    userId,
    '🎉 Premium Activated!',
    'Your FaithStream Premium subscription is now active. Enjoy ad-free listening!',
    { type: 'subscription_activated' }
  );

  return { success: true, message: 'Subscription activated!' };
};

// ── Create a Razorpay Payment Link (legacy, kept for admin use) ───────────────

exports.createPaymentLink = async (userId) => {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

  const payload = {
    amount: PREMIUM_AMOUNT,          // e.g. 9900 paise = ₹99
    currency: 'INR',
    description: 'FaithStream Premium — 1 Month',
    expire_by: Math.floor(Date.now() / 1000) + 3 * 24 * 3600, // 3 days to pay
    reminder_enable: true,
    notes: {
      user_id: userId,
      plan: 'PREMIUM',
    },
    notify: { sms: true, email: true },
    callback_url: `${APP_BASE_URL}/api/subscriptions/payment/success`,
    callback_method: 'get',
  };

  try {
    const response = await axios.post(
      'https://api.razorpay.com/v1/payment_links',
      payload,
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    return {
      payment_link_id: response.data.id,
      payment_url: response.data.short_url,
      amount: PREMIUM_AMOUNT / 100,
      expires_at: new Date((Math.floor(Date.now() / 1000) + 3 * 24 * 3600) * 1000),
    };
  } catch (err) {
    // Fallback for development (no Razorpay keys configured)
    console.warn('[Subscription] Razorpay not configured — returning mock payment link');
    return {
      payment_link_id: `mock_${Date.now()}`,
      payment_url: `https://rzp.io/l/mock-faithstream`,
      amount: PREMIUM_AMOUNT / 100,
      expires_at: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    };
  }
};

// ── Get subscription status for a user ────────────────────────────────────────

exports.getUserSubscription = async (userId) => {
  const sub = await subRepo.findActiveByUser(userId);
  if (!sub) {
    return {
      is_active: false,
      plan: 'FREE',
      status: 'INACTIVE',
    };
  }
  return {
    ...sub,
    is_active: true,
    plan: sub.plan || 'PREMIUM',
    days_remaining: Math.max(0, Math.ceil(parseFloat(sub.days_remaining))),
  };
};

// ── Webhook: payment_link.paid ─────────────────────────────────────────────────

exports.handleWebhook = async (req) => {
  const body      = req.body; // raw Buffer from express.raw()
  const signature = req.headers['x-razorpay-signature'];

  // Verify signature (constant-time comparison to prevent timing attacks)
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  const sigValid = expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  if (!sigValid) {
    throw new Error('Invalid webhook signature');
  }

  const event   = JSON.parse(body);
  const evtName = event.event;
  const payload = event.payload;

  console.log(`[Subscription Webhook] Event: ${evtName}`);

  // Payment link paid
  if (evtName === 'payment_link.paid') {
    const payment = payload.payment?.entity;
    const notes   = payload.payment_link?.entity?.notes || payment?.notes || {};
    const userId  = notes.user_id;
    const amount  = (payment?.amount || PREMIUM_AMOUNT) / 100;

    if (userId) {
      // Activate subscription
      await subRepo.activateByPaymentId(userId, payment.id, amount);
      console.log(`[Subscription] Activated PREMIUM for user ${userId}`);

      // Notify user
      notificationService.sendToUser(
        userId,
        '🎉 Premium Activated!',
        'Your FaithStream Premium subscription is now active. Enjoy ad-free listening!',
        { type: 'subscription_activated' }
      );
    }
    return;
  }

  // Also handle generic payment.captured (backup)
  if (evtName === 'payment.captured') {
    const payment = payload.payment?.entity;
    const notes   = payment?.notes || {};
    const userId  = notes.user_id;
    const amount  = (payment?.amount || PREMIUM_AMOUNT) / 100;

    if (userId && notes.plan === 'PREMIUM') {
      await subRepo.activateByPaymentId(userId, payment.id, amount);
      console.log(`[Subscription] Activated PREMIUM (payment.captured) for user ${userId}`);
    }
  }
};

// ── Admin: stats ──────────────────────────────────────────────────────────────

exports.getAdminStats = async (month) => {
  return subRepo.getRevenueSummary(month);
};

// ── Admin: list ───────────────────────────────────────────────────────────────

exports.getAdminList = async (options) => {
  return subRepo.findAllForAdmin(options);
};

// ── Admin: grant / revoke ─────────────────────────────────────────────────────

exports.grantPremium = async (userId) => {
  await subRepo.grantPremium(userId);
};

exports.revokePremium = async (userId) => {
  await subRepo.revokePremium(userId);
};

// ── Expiry sweep (called by cron) ─────────────────────────────────────────────

exports.expireSubscriptions = async () => {
  const expired = await subRepo.expireOverdue();
  console.log(`[Subscription Expiry] Expired ${expired.length} subscription(s)`);
  // TODO: send push notifications to expired.map(r => r.user_id)
  return expired;
};
