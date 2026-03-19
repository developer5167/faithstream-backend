const songRepo = require('../repositories/song.repo');
const albumRepo = require('../repositories/album.repo');
const adminLog = require('../repositories/adminAction.repo');
const userRepo = require('../repositories/user.repo');
const notificationService = require('./notification.service');
const redisClient = require('../config/redis');


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
    track_number: data.track_number || null,
    singer: data.singer
  });

  // Inject a transcoding job into the Redis Queue
  if (song && song.audio_original_url) {
    console.log(`[SongService] Enqueuing HLS job for song: ${song.id}`);
    try {
      const payload = JSON.stringify({
        songId: song.id,
        audio_url: song.audio_original_url
      });
      await redisClient.lPush('hls_transcoding_queue', payload);
      console.log(`[SongService] Successfully enqueued job to hls_transcoding_queue`);
    } catch (redisError) {
      console.error(`[SongService] FAILED to enqueue HLS job:`, redisError.message);
    }
  } else {
    console.log(`[SongService] Skipping HLS enqueue: song=${!!song}, audio=${song?.audio_original_url}`);
  }

  return song;
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

  const song = await songRepo.getSongById(songId);
  if (song && song.artist_user_id) {
    // Notify the artist
    notificationService.sendToUser(
      song.artist_user_id,
      '✅ Song Approved',
      `Great news! Your song "${song.title}" is now live on FaithStream.`,
      { type: 'song_approved', song_id: song.id }
    ).catch(err => console.error('Failed to notify artist:', err));

    // Notify followers
    const followRepo = require('../repositories/follow.repo');
    const followerIds = await followRepo.getFollowers(song.artist_user_id);
    if (followerIds.length > 0) {
      notificationService.sendToUsers(
        followerIds,
        '🎵 New Content',
        `An artist you follow just released a new song: "${song.title}"`,
        { type: 'new_song', song_id: song.id, artist_id: song.artist_user_id }
      ).catch(err => console.error('Failed to notify followers:', err));
    }
  }

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
  const song = await songRepo.getSongById(songId);
  if (!song) return;

  // 1. Notify the artist FIRST before deleting the record
  if (song.artist_user_id) {
    notificationService.sendToUser(
      song.artist_user_id,
      '❌ Song Review Update',
      `Your song "${song.title}" was rejected and removed. Reason: ${reason || 'Not specified'}`,
      { type: 'song_rejected', song_title: song.title }
    ).catch(err => console.error('Failed to notify artist:', err));
  }

  // 2. Wipe files from S3
  await songRepo.wipeSongFilesFromS3(songId);

  // 3. Delete from DB
  await songRepo.delete(songId);

  // 4. Log the action
  if (adminId) {
    await adminLog.log({
      admin_id: adminId,
      action_type: 'SONG_REJECTED_AND_DELETED',
      target_id: songId,
      description: `Song "${song.title}" rejected and deleted by admin${reason ? `: ${reason}` : ''}`
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
    track_number: data.track_number || null,
    singer: data.singer
  });

  if (song && song.audio_original_url) {
    console.log(`[SongService] Enqueuing HLS job for song (on behalf): ${song.id}`);
    try {
      await redisClient.lPush('hls_transcoding_queue', JSON.stringify({
        songId: song.id,
        audio_url: song.audio_original_url
      }));
      console.log(`[SongService] Successfully enqueued job to hls_transcoding_queue`);
    } catch (redisError) {
      console.error(`[SongService] FAILED to enqueue HLS job:`, redisError.message);
    }
  }

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

  // Only allow updates if song is in DRAFT status, unless admin
  if (!isAdmin && song.status !== 'DRAFT') {
    throw new Error('Cannot update songs that have been submitted or approved');
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

  const updatedSong = await songRepo.update(songId, data);
  
  if (data.audio_original_url && data.audio_original_url !== song.audio_original_url) {
    await redisClient.lPush('hls_transcoding_queue', JSON.stringify({
      songId: updatedSong.id,
      audio_url: updatedSong.audio_original_url
    }));
  }
  
  return updatedSong;
};

exports.getSongDetails = async (songId) => {
  const song = await songRepo.findFullDetailsById(songId);
  if (!song) {
    throw new Error('Song not found');
  }
  return song;
};