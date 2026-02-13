const albumService = require('../services/album.service');

exports.createAlbum = async (req, res) => {
  try {
    // Admin can create for any artist by passing artist_user_id
    // Regular artist creates for themselves
    const artistId = req.user.is_admin && req.body.artist_user_id 
      ? req.body.artist_user_id 
      : req.user.id;
    
    const album = await albumService.createAlbum(artistId, req.body);
    res.json(album);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getMyAlbums = async (req, res) => {
  res.json(await albumService.getArtistAlbums(req.user.id));
};

exports.submitAlbum = async (req, res) => {
  try {
    await albumService.submitAlbum(req.body.album_id, req.user.id);
    res.json({ message: 'Album submitted for review' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPendingAlbums = async (req, res) => {
  res.json(await albumService.getPendingAlbums());
};

exports.getAlbumTracks = async (req, res) => {
  try {
    const result = await albumService.getAlbumTracks(req.params.albumId);
    res.json(result);
  } catch (error) {
    res.status(error.message === 'Album not found' ? 404 : 400).json({ error: error.message });
  }
};
exports.getAlbumTracksForUser = async (req, res) => {
  try {
    const result = await albumService.getAlbumTracksForUser(req.params.albumId);
    res.json(result);
  } catch (error) {
    res.status(error.message === 'Album not found' ? 404 : 400).json({ error: error.message });
  }
};

exports.approveAlbum = async (req, res) => {
  await albumService.approveAlbum(req.body.albumId);
  res.json({ message: 'Album approved' });
};

exports.rejectAlbum = async (req, res) => {
  await albumService.rejectAlbum(req.body.albumId, req.body.reason);
  res.json({ message: 'Album rejected' });
};

exports.createAlbumOnBehalfOfArtist = async (req, res) => {
  try {
    const album = await albumService.createAlbumOnBehalfOfArtist(
      req.body.artist_user_id,
      req.user.id,
      req.body
    );
    res.json(album);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.submitAlbumOnBehalfOfArtist = async (req, res) => {
  try {
    await albumService.submitAlbum(req.body.album_id, req.body.artist_user_id);
    res.json({ message: 'Album submitted for review' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateAlbum = async (req, res) => {
  try {
    const album = await albumService.updateAlbum(
      req.params.id,
      req.user,
      req.body
    );
    res.json(album);
  } catch (error) {
    res.status(error.message === 'Album not found' ? 404 : 400).json({ error: error.message });
  }
};

exports.updateAlbumByAdmin = async (req, res) => {
  try {
    const album = await albumService.updateAlbumByAdmin(
      req.params.id,
      req.body
    );
    res.json(album);
  } catch (error) {
    res.status(error.message === 'Album not found' ? 404 : 400).json({ error: error.message });
  }
};
