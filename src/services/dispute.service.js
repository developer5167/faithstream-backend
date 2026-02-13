const disputeRepo = require('../repositories/dispute.repo');
const songRepo = require('../repositories/song.repo');

exports.getOpenDisputes = async () => {
  return disputeRepo.findOpen();
};

exports.resolve = async (disputeId, winnerSongId) => {
  const dispute = await disputeRepo.findById(disputeId);

  // Winner stays
  await songRepo.updateStatus(winnerSongId, 'APPROVED');

  // Loser removed
  const loserId =
    dispute.song_id === winnerSongId
      ? dispute.existing_song_id
      : dispute.song_id;

  await songRepo.updateStatus(loserId, 'REJECTED');

  await disputeRepo.markResolved(disputeId);
};
