require('./config/env');
const app = require('./app');
const logger = require('./config/logger');

app.listen(process.env.PORT, () => {
  logger.info(`🚀 FaithStream backend running on port ${process.env.PORT}`);
  _startCronJobs();
});

function _startCronJobs() {
  try {
    const cron = require('node-cron');
    const payoutJob = require('./jobs/monthly-payout.job');
    const expiryJob = require('./jobs/subscription-expiry.job');

    // Monthly payout: 02:00 AM on the 1st of every month
    cron.schedule('0 2 1 * *', async () => {
      const now  = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      console.log(`[Cron] Running monthly payout job for ${month}`);
      try {
        const result = await payoutJob.runMonthlyPayout(month);
        logger.info('[Cron] Monthly payout complete', result);
      } catch (err) {
        logger.error('[Cron] Monthly payout failed', { error: err.message });
      }
    });
    logger.info('[Cron] Monthly payout job scheduled (1st of every month @ 02:00 AM)');

    // Daily subscription expiry: 02:00 AM every day
    expiryJob();
    
    // Hourly ad cleanup
    const adCleanup = require('./jobs/ad_cleanup.job');
    adCleanup.startAdCleanupJob();

    // Daily draft cleanup: 03:00 AM every day
    const draftCleanup = require('./jobs/draft-cleanup.job');
    draftCleanup();

  } catch (err) {
    logger.warn('[Cron] node-cron not installed — cron jobs will not auto-run. Run: npm install node-cron');
  }
}
