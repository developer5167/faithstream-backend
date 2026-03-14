const albumRepo = require('../repositories/album.repo');
const songRepo = require('../repositories/song.repo');
const adminLog = require('../repositories/adminAction.repo');
const userRepo = require('../repositories/user.repo');
const notificationService = require('./notification.service');


exports.createAlbum = async (artistId, data) => {
  // Verify the artist is approved
  const artist = await userRepo.findById(artistId);
  if (!artist) {
    throw new Error('Artist not found');
  }
  if (artist.artist_status !== 'APPROVED') {
    throw new Error('Can only create albums for approved artists');
  }
  
  return albumRepo.create({
    artist_user_id: artistId,
    title: data.title,
    description: data.description,
    language: data.language,
    release_type: data.release_type,
    cover_image_url: data.cover_image_url
  });
};

exports.getArtistAlbums = async (artistId) => {
  return albumRepo.findByArtist(artistId);
};

exports.getArtistPublicAlbums = async (artistId) => {
  return albumRepo.findPublicByArtist(artistId);
};

exports.submitAlbum = async (albumId, artistId) => {
  const songs = await songRepo.findByAlbum(albumId);
  if (!songs.length) throw new Error('Album has no songs');

  await albumRepo.updateStatus(albumId, 'PENDING');
  await songRepo.markAlbumSongsPending(albumId);
};

exports.getPendingAlbums = async () => {
  return albumRepo.findPending();
};

exports.approveAlbum = async (albumId) => {
  await albumRepo.updateStatus(albumId, 'APPROVED');
  // Also approve all songs that belong to this album
  await songRepo.markAlbumSongsApproved(albumId);

  const album = await albumRepo.findById(albumId);
  if (album && album.artist_user_id) {
    notificationService.sendToUser(
      album.artist_user_id,
      '✅ Album Approved',
      `Great news! Your album "${album.title}" is now live.`,
      { type: 'album_approved', album_id: album.id }
    ).catch(err => console.error('Failed to notify artist:', err));
  }
};

const s3Util = require('../utils/s3.util');

exports.rejectAlbum = async (albumId, reason, adminId) => {
  const album = await albumRepo.findById(albumId);
  if (!album) return;

  // 1. Get all songs in the album to wipe their files
  const songs = await songRepo.findByAlbum(albumId);

  // 2. Notify the artist FIRST
  if (album.artist_user_id) {
    notificationService.sendToUser(
      album.artist_user_id,
      '❌ Album Review Update',
      `Your album "${album.title}" was rejected and removed. Reason: ${reason || 'Not specified'}`,
      { type: 'album_rejected', album_title: album.title }
    ).catch(err => console.error('Failed to notify artist:', err));
  }

  // 3. Wipe all song files from S3
  for (const song of songs) {
    await songRepo.wipeSongFilesFromS3(song.id);
  }

  // 4. Wipe album cover from S3
  if (album.cover_image_url) {
    await s3Util.deleteFromS3ByUrl(album.cover_image_url);
  }

  // 5. Delete songs from DB
  await songRepo.deleteByAlbumId(albumId);

  // 6. Delete album from DB
  await albumRepo.delete(albumId);

  // 7. Log accurately
  if (adminId) {
    await adminLog.log({
      admin_id: adminId,
      action_type: 'ALBUM_REJECTED_AND_DELETED',
      target_id: albumId,
      description: `Album "${album.title}" and its ${songs.length} songs were rejected and deleted by admin${reason ? `: ${reason}` : ''}`
    });
  }
};

exports.getAlbumTracks = async (albumId) => {
  const album = await albumRepo.findById(albumId);
  if (!album) throw new Error('Album not found');
  const songs = await songRepo.findByAlbum(albumId);
  return { album, songs };
};

exports.getAlbumTracksForUser = async (albumId) => {
  const album = await albumRepo.findById(albumId);
  if (!album) throw new Error('Album not found');
  const songs = await songRepo.findByAlbum(albumId);
  return {album, songs };
};

exports.createAlbumOnBehalfOfArtist = async (artistId, adminId, data) => {
  // Verify the artist is approved
  const artist = await userRepo.findById(artistId);
  if (!artist) {
    throw new Error('Artist not found');
  }
  if (artist.artist_status !== 'APPROVED') {
    throw new Error('Can only create albums for approved artists');
  }
  
  const album = await albumRepo.create({
    artist_user_id: artistId,
    title: data.title,
    description: data.description,
    language: data.language,
    release_type: data.release_type,
    cover_image_url: data.cover_image_url
  });

  await adminLog.log({
    admin_id: adminId,
    action_type: 'ALBUM_CREATED_FOR_ARTIST',
    target_id: album.id,
    description: `Admin created album "${data.title}" for artist ID ${artistId}`
  });

  return album;
};

exports.updateAlbum = async (albumId, user, data) => {
  // Verify album exists
  const album = await albumRepo.findById(albumId);
  if (!album) {
    throw new Error('Album not found');
  }
  
  // Get the artist associated with this album
  const artist = await userRepo.findById(album.artist_user_id);
  if (!artist) {
    throw new Error('Artist not found');
  }
  
  // Check if the artist is approved (applies to both admin and artist uploads)
  if (artist.artist_status !== 'APPROVED') {
    throw new Error('Can only upload for approved artists');
  }
  
  // Artists can only update their own albums, admins can update any album
  if (!user.is_admin && album.artist_user_id !== user.id) {
    throw new Error('You can only update your own albums');
  }
  
  if (album.status !== 'DRAFT') {
    throw new Error('Cannot update album that has been submitted or approved');
  }

  return albumRepo.update(albumId, data);
};

exports.updateAlbumByAdmin = async (albumId, data) => {
  // Admin can update any album in DRAFT status
  const album = await albumRepo.findById(albumId);
  if (!album) {
    throw new Error('Album not found');
  }
  if (album.status !== 'DRAFT') {
    throw new Error('Cannot update album that has been submitted or approved');
  }

  return albumRepo.update(albumId, data);
};

exports.getAlbumDetails = async (albumId) => {
  const album = await albumRepo.findFullDetailsById(albumId);
  if (!album) {
    throw new Error('Album not found');
  }
  return album;
};
