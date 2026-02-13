const complaintRepo = require('../repositories/complaint.repo');
const songRepo = require('../repositories/song.repo');

exports.create = async (songId, userId, reason) => {
  await complaintRepo.create(songId, userId, reason);

  // Immediate safety action
  await songRepo.updateStatus(songId, 'TAKEN_DOWN');
};

exports.getByUser = async (userId) => {
  return complaintRepo.findByUser(userId);
};

exports.getOpenComplaints = async () => {
  return complaintRepo.findOpen();
};

exports.resolve = async (complaintId, action) => {
  const complaint = await complaintRepo.findById(complaintId);

  if (action === 'RESTORE') {
    await songRepo.updateStatus(complaint.song_id, 'APPROVED');
  }

  if (action === 'REMOVE') {
    await songRepo.updateStatus(complaint.song_id, 'REJECTED');
  }

  await complaintRepo.markResolved(complaintId);
};
