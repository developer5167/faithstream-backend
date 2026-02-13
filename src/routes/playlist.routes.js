const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlist.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// GET /playlists - Get all playlists
router.get('/', playlistController.getPlaylists);

// GET /playlists/:id - Get playlist by ID
router.get('/:id', playlistController.getPlaylistById);

// POST /playlists - Create playlist
router.post('/', playlistController.createPlaylist);

// PUT /playlists/:id - Update playlist
router.put('/:id', playlistController.updatePlaylist);

// DELETE /playlists/:id - Delete playlist
router.delete('/:id', playlistController.deletePlaylist);

// POST /playlists/:id/songs - Add song to playlist
router.post('/:id/songs', playlistController.addSongToPlaylist);

// DELETE /playlists/:id/songs/:songId - Remove song from playlist
router.delete('/:id/songs/:songId', playlistController.removeSongFromPlaylist);

module.exports = router;
