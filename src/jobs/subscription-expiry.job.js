const cron        = require('node-cron');
const subService  = require('../services/subscription.service');
const notificationService = require('../services/notification.service');

/**
 * Daily at 02:00 AM — expire overdue subscriptions and notify users.
 */
module.exports = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Running subscription expiry sweep...');
    try {
      const expired = await subService.expireSubscriptions();
      console.log(`[Cron] Subscription expiry complete. ${expired.length} expired.`);
      
      // Notify each user that their subscription expired
      for (const sub of expired) {
        notificationService.sendToUser(
          sub.user_id,
          '⚠️ Subscription Expired',
          'Your FaithStream Premium subscription has expired. Renew now to keep enjoying ad-free listening.',
          { type: 'subscription_expired' }
        ).catch(err => console.error(`Failed to notify user ${sub.user_id}:`, err));
      }
    } catch (err) {
      console.error('[Cron] Subscription expiry error:', err);
    }
  });
  console.log('[Cron] Subscription expiry job registered (daily 02:00)');
};

