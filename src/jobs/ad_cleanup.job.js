const cron = require('node-cron');
const adRepo = require('../repositories/ad.repo');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});

// Run every hour
const startAdCleanupJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Ad Cleanup Job] Checking for expired ads...');
    try {
      const expiredAds = await adRepo.getExpiredWithS3Keys();
      
      for (const ad of expiredAds) {
        if (ad.s3_key) {
          console.log(`[Ad Cleanup Job] Deleting ${ad.s3_key} from S3...`);
          try {
              await s3.deleteObject({
                Bucket: process.env.AWS_BUCKET,
                Key: ad.s3_key
              }).promise();
          } catch(e) {
              console.error(`[Ad Cleanup Job] Failed to delete S3 object ${ad.s3_key}`, e);
          }
        }
        
        console.log(`[Ad Cleanup Job] Deleting advertisement ${ad.id} from DB...`);
        await adRepo.deleteAd(ad.id);
      }
    } catch (error) {
      console.error('[Ad Cleanup Job] Error running ad cleanup job:', error);
    }
  });
};

module.exports = { startAdCleanupJob };
