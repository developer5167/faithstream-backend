const songService = require('../services/song.service');

exports.createSong = async (req, res) => {
  try {
    // Admin can create for any artist by passing artist_user_id
    // Regular artist creates for themselves
    const artistId = req.user.is_admin && req.body.artist_user_id 
      ? req.body.artist_user_id 
      : req.user.id;
    
    const song = await songService.createSong(artistId, req.body);
    res.json(song);
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.getMySongs = async (req, res) => {
  const songs = await songService.getArtistSongs(req.user.id);
  res.json(songs);
};

exports.getPendingSongs = async (req, res) => {
  const songs = await songService.getPendingSongs();
  res.json(songs);
};

exports.getPendingIndividualSongs = async (req, res) => {
  const songs = await songService.getPendingIndividualSongs();
  res.json(songs);
};

exports.getPendingAlbumSongs = async (req, res) => {
  const songs = await songService.getPendingAlbumSongs();
  res.json(songs);
};

exports.approveSong = async (req, res) => {
  await songService.approveSong(req.body.songId, req.user.id);
  res.json({ message: 'Song approved' });
};

exports.rejectSong = async (req, res) => {
  await songService.rejectSong(req.body.songId, req.body.reason, req.user.id);
  res.json({ message: 'Song rejected' });
};

exports.createSongOnBehalfOfArtist = async (req, res) => {
  const song = await songService.createSongOnBehalfOfArtist(
    req.body.artist_user_id,
    req.user.id,
    req.body
  );
  res.json(song);
};

exports.updateSong = async (req, res) => {
  try {
    const song = await songService.updateSong(
      req.params.id,
      req.user.id,
      req.user.is_admin,
      req.body
    );
    res.json(song);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
