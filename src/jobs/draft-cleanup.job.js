const albumService = require('../services/album.service');
const albumRepo = require('../repositories/album.repo');
const cron = require('node-cron');

/**
 * Job to clean up draft albums older than 7 days.
 * This runs once a day.
 */
async function runDraftCleanup() {
  console.log('[DraftCleanup] Starting draft cleanup job...');
  try {
    const oldDrafts = await albumRepo.findDraftsOlderThan(7);
    console.log(`[DraftCleanup] Found ${oldDrafts.length} draft albums older than 7 days.`);

    for (const album of oldDrafts) {
      console.log(`[DraftCleanup] Deleting expired draft album: ${album.title} (${album.id})`);
      try {
        // We reuse rejectAlbum logic as it handles deleting songs, wiping S3, etc.
        // Even though it's not a "rejection" in the traditional sense, the cleanup logic is identical.
        await albumService.rejectAlbum(album.id, 'Automatic cleanup: Draft expired after 7 days.', null);
      } catch (err) {
        console.error(`[DraftCleanup] Failed to delete album ${album.id}:`, err.message);
      }
    }

    console.log('[DraftCleanup] Draft cleanup job complete.');
  } catch (err) {
    console.error('[DraftCleanup] Draft cleanup job failed:', err.message);
  }
}

// Export a function to schedule the job
module.exports = () => {
    // Run daily at 03:00 AM
    cron.schedule('0 3 * * *', runDraftCleanup);
    console.log('[Cron] Draft cleanup job scheduled (Daily @ 03:00 AM)');
};
