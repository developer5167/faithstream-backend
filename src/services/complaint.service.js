const complaintRepo = require('../repositories/complaint.repo');
const songRepo = require('../repositories/song.repo');
const duplicateDetectionService = require('./duplicate_detection.service');

exports.create = async (title, description, contentId, contentType, userId, artistName, songName, albumName) => {
  await complaintRepo.create(title, description, contentId, contentType, userId, artistName, songName, albumName);
};

exports.getByUser = async (userId) => {
  return complaintRepo.findByUser(userId);
};

exports.getOpenComplaints = async () => {
  return complaintRepo.findOpen();
};

exports.linkContent = async (complaintId, contentId, contentType) => {
  await complaintRepo.linkContent(complaintId, contentId, contentType);
};

exports.resolve = async (complaintId, action, masterSongId, adminId) => {
  const complaint = await complaintRepo.findById(complaintId);

  if (complaint.content_type === 'SONG' && complaint.content_id) {
    if (action === 'RESTORE') {
      await songRepo.updateStatus(complaint.content_id, 'APPROVED');
    }

    if (action === 'REMOVE') {
      const song = await songRepo.getSongById(complaint.content_id);
      await songRepo.updateStatus(complaint.content_id, 'REJECTED');
      
      // Physically wipe duplicate's S3 files to prevent junk data (Hybrid Approach)
      await songRepo.wipeSongFilesFromS3(complaint.content_id);
      
      if (song && song.artist_user_id) {
        const userRepo = require('../repositories/user.repo');
        const notificationService = require('./notification.service');
        
        await userRepo.incrementCopyrightStrikes(song.artist_user_id);
        await notificationService.sendToUser(
          song.artist_user_id,
          'Song Removed Due to Copyright',
          `Your song '${song.title}' was removed due to a copyright complaint. Repeat violations may result in a permanent ban.`
        );
      }
    }

    if (action === 'MERGE' && masterSongId) {
      const song = await songRepo.getSongById(complaint.content_id);
      await duplicateDetectionService.mergeSongs(masterSongId, complaint.content_id, adminId);

      // Merging confirms the song was an unauthorized copy → issue a copyright strike
      if (song && song.artist_user_id) {
        const userRepo = require('../repositories/user.repo');
        const notificationService = require('./notification.service');

        await userRepo.incrementCopyrightStrikes(song.artist_user_id);
        await notificationService.sendToUser(
          song.artist_user_id,
          'Copyright Strike Issued',
          `Your song '${song.title}' was found to be a duplicate of an original track. Its streams have been merged into the original and you have received a copyright strike. Repeat violations may result in a permanent ban.`
        );
      }
    }
  }

  await complaintRepo.markResolved(complaintId);
};
