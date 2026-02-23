/**
 * Monthly Payout Job
 * Calculates pro-rata earnings for all artists and credits their wallets.
 * Runs automatically on the 1st of every month via node-cron (see server.js).
 * Can also be triggered manually via POST /api/admin/payouts/trigger.
 */

const streamRepo = require('../repositories/stream.repo');
const payoutRepo = require('../repositories/payout.repo');

const ARTIST_CUT = 0.70; // 70% of revenue goes to artists

/**
 * @param {string} month - YYYY-MM format, e.g. "2026-02"
 */
exports.runMonthlyPayout = async (month) => {
  console.log(`[MonthlyPayoutJob] Starting calculation for ${month}`);

  const totalRevenue = await streamRepo.getMonthlyRevenue(month);
  console.log(`[MonthlyPayoutJob] Total revenue for ${month}: ₹${totalRevenue}`);

  if (totalRevenue === 0) {
    console.log(`[MonthlyPayoutJob] No revenue for ${month}, skipping.`);
    return { month, skipped: true, reason: 'No revenue' };
  }

  const artistPool  = totalRevenue * ARTIST_CUT;
  const totalStreams = await streamRepo.getTotalStreamsForMonth(month);
  console.log(`[MonthlyPayoutJob] Total streams: ${totalStreams}, Artist pool: ₹${artistPool}`);

  if (totalStreams === 0) {
    console.log(`[MonthlyPayoutJob] No streams for ${month}, skipping.`);
    return { month, skipped: true, reason: 'No streams' };
  }

  const artistStreams = await streamRepo.getMonthlyArtistStreams(month);
  let credited = 0;

  for (const row of artistStreams) {
    const share  = parseInt(row.streams) / totalStreams;
    const amount = parseFloat((artistPool * share).toFixed(2));

    if (amount <= 0) continue;

    try {
      // Upsert earnings record
      await payoutRepo.create({
        artist_user_id: row.artist_user_id,
        month,
        total_streams:  parseInt(row.streams),
        amount,
      });

      // Credit wallet
      await payoutRepo.creditWallet(row.artist_user_id, amount);
      credited++;

      console.log(`[MonthlyPayoutJob] Credited artist ${row.artist_user_id}: ₹${amount} (${row.streams} streams, ${(share * 100).toFixed(2)}%)`);
    } catch (err) {
      console.error(`[MonthlyPayoutJob] Failed to credit artist ${row.artist_user_id}:`, err.message);
    }
  }

  console.log(`[MonthlyPayoutJob] Done. ${credited}/${artistStreams.length} artists credited.`);

  return {
    month,
    totalRevenue,
    artistPool,
    totalStreams,
    artistsProcessed: artistStreams.length,
    artistsCredited:  credited,
  };
};
