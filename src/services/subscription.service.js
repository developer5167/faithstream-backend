const razorpay = require('../utils/razorpay.util');
const crypto = require('crypto');
const subRepo = require('../repositories/subscription.repo');

exports.createRazorpaySubscription = async (userId) => {
  // Frontend will use this subscription_id
  const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID,
    total_count: 12, // 1 year monthly
    customer_notify: 1,
  });

  return {
    razorpay_subscription_id: subscription.id,
  };
};

exports.getUserSubscription = async (userId) => {
  return subRepo.findActiveByUser(userId);
};

exports.handleWebhook = async (req) => {
  const body = JSON.stringify(req.body);
  const signature = req.headers['x-razorpay-signature'];

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== signature) {
    throw new Error('Invalid webhook');
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === 'subscription.activated') {
    await subRepo.activate(
      payload.subscription.entity.customer_id,
      payload.subscription.entity.current_start * 1000,
      payload.subscription.entity.current_end * 1000
    );
  }

  if (event === 'subscription.cancelled') {
    await subRepo.cancel(payload.subscription.entity.customer_id);
  }
};
