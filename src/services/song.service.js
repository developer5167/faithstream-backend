const songRepo = require('../repositories/song.repo');
const albumRepo = require('../repositories/album.repo');
const adminLog = require('../repositories/adminAction.repo');
const userRepo = require('../repositories/user.repo');

exports.createSong = async (artistId, data) => {
  // Verify the artist is approved
  const artist = await userRepo.findById(artistId);
  if (!artist) {
    throw new Error('Artist not found');
  }
  if (artist.artist_status !== 'APPROVED') {
    throw new Error('Can only create songs for approved artists');
  }
  
  // If adding to an album, validate album exists and is in DRAFT status
  if (data.album_id) {
    const album = await albumRepo.findById(data.album_id);
    if (!album) {
      throw new Error('Album not found');
    }
    if (album.artist_user_id !== artistId) {
      throw new Error('You can only add songs to your own albums');
    }
    if (album.status !== 'DRAFT') {
      throw new Error('Cannot add songs to an album that has already been submitted or approved');
    }
  }

  return songRepo.create({
    artist_user_id: artistId,
    title: data.title,
    language: data.language,
    genre: data.genre,
    lyrics: data.lyrics,
    description: data.description,
    audio_original_url: data.audio_original_url,
    cover_image_url: data.cover_image_url || null,
    album_id: data.album_id || null,
    track_number: data.track_number || null
  });
};

exports.getArtistSongs = async (artistId) => {
  return songRepo.findByArtist(artistId);
};

exports.getArtistPublicSongs = async (artistId) => {
  console.log("artistId",artistId); 
  return songRepo.findPublicByArtist(artistId);
};

exports.getPendingSongs = async () => {
  return songRepo.findPending();
};

exports.getPendingIndividualSongs = async () => {
  return songRepo.findPendingIndividualSongs();
};

exports.getPendingAlbumSongs = async () => {
  return songRepo.findPendingAlbumSongs();
};

exports.approveSong = async (songId, adminId) => {
  await songRepo.updateStatus(songId, 'APPROVED');

  if (adminId) {
    await adminLog.log({
      admin_id: adminId,
      action_type: 'SONG_APPROVED',
      target_id: songId,
      description: 'Song approved by admin'
    });
  }
};

exports.rejectSong = async (songId, reason, adminId) => {
  await songRepo.reject(songId, reason);

  if (adminId) {
    await adminLog.log({
      admin_id: adminId,
      action_type: 'SONG_REJECTED',
      target_id: songId,
      description: `Song rejected by admin${reason ? `: ${reason}` : ''}`
    });
  }
};

exports.createSongOnBehalfOfArtist = async (artistId, adminId, data) => {
  // Admin can add songs to albums in any status (more flexibility)
  if (data.album_id) {
    const album = await albumRepo.findById(data.album_id);
    if (!album) {
      throw new Error('Album not found');
    }
    if (album.artist_user_id !== artistId) {
      throw new Error('Album does not belong to the specified artist');
    }
  }

  const song = await songRepo.create({
    artist_user_id: artistId,
    title: data.title,
    language: data.language,
    genre: data.genre,
    lyrics: data.lyrics,
    description: data.description,
    audio_original_url: data.audio_original_url,
    cover_image_url: data.cover_image_url || null,
    album_id: data.album_id || null,
    track_number: data.track_number || null
  });

  await adminLog.log({
    admin_id: adminId,
    action_type: 'SONG_CREATED_FOR_ARTIST',
    target_id: song.id,
    description: `Admin created song "${data.title}" for artist ID ${artistId}`
  });

  return song;
};

exports.updateSong = async (songId, artistId, isAdmin, data) => {
  // Get the song first
  const song = await songRepo.getSongById(songId);
  if (!song) {
    throw new Error('Song not found');
  }

  // Check authorization - artist can only update their own songs, admin can update any
  if (!isAdmin && song.artist_user_id !== artistId) {
    throw new Error('You can only update your own songs');
  }

  // Only allow updates if song is in DRAFT or PENDING status, unless admin
  if (!isAdmin && song.status !== 'DRAFT' && song.status !== 'PENDING') {
    throw new Error('Cannot update songs that have been approved or rejected');
  }

  // If updating album_id, validate the album
  if (data.album_id !== undefined && data.album_id !== null) {
    const album = await albumRepo.findById(data.album_id);
    if (!album) {
      throw new Error('Album not found');
    }
    if (album.artist_user_id !== song.artist_user_id) {
      throw new Error('Album does not belong to the song artist');
    }
    if (!isAdmin && album.status !== 'DRAFT') {
      throw new Error('Cannot add songs to an album that has already been submitted or approved');
    }
    data.album_id = album.id;
  }

  return songRepo.update(songId, data);
};