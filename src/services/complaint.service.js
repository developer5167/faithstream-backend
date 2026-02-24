const complaintRepo = require('../repositories/complaint.repo');
const songRepo = require('../repositories/song.repo');

exports.create = async (title, description, contentId, contentType, userId) => {
  await complaintRepo.create(title, description, contentId, contentType, userId);

  // Immediate safety action for songs
  if (contentType === 'SONG' && contentId) {
    try {
      await songRepo.updateStatus(contentId, 'TAKEN_DOWN');
    } catch(err) {
      console.error('Failed to auto takedown song:', err);
    }
  }
};

exports.getByUser = async (userId) => {
  return complaintRepo.findByUser(userId);
};

exports.getOpenComplaints = async () => {
  return complaintRepo.findOpen();
};

exports.resolve = async (complaintId, action) => {
  const complaint = await complaintRepo.findById(complaintId);

  if (complaint.content_type === 'SONG' && complaint.content_id) {
    if (action === 'RESTORE') {
      await songRepo.updateStatus(complaint.content_id, 'APPROVED');
    }

    if (action === 'REMOVE') {
      await songRepo.updateStatus(complaint.content_id, 'REJECTED');
    }
  }

  await complaintRepo.markResolved(complaintId);
};
