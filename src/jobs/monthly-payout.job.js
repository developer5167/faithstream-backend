const streamRepo = require('../repositories/stream.repo');
const subRepo = require('../repositories/subscription.repo');
const payoutRepo = require('../repositories/payout.repo');

const PLATFORM_CUT = 0.30;
const ARTIST_CUT = 0.70;

exports.runMonthlyPayout = async (month) => {
  const totalRevenue = await subRepo.getMonthlyRevenue(month);
  if (totalRevenue === 0) return;

  const artistPool = totalRevenue * ARTIST_CUT;

  const totalStreams = await streamRepo.getTotalStreamsForMonth(month);
  if (totalStreams === 0) return;

  const artistStreams = await streamRepo.getMonthlyArtistStreams(month);

  for (const row of artistStreams) {
    const share = row.streams / totalStreams;
    const amount = artistPool * share;

    await payoutRepo.create({
      artist_user_id: row.artist_user_id,
      month,
      total_streams: row.streams,
      amount,
    });
  }
};
