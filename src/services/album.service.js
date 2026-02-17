const albumRepo = require('../repositories/album.repo');
const songRepo = require('../repositories/song.repo');
const adminLog = require('../repositories/adminAction.repo');
const userRepo = require('../repositories/user.repo');

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
};

exports.rejectAlbum = async (albumId, reason) => {
  await albumRepo.reject(albumId, reason);
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
