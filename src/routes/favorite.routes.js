const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// GET /favorites - Get all favorites
router.get('/', favoriteController.getFavorites);

// GET /favorites/:songId/check - Check if song is favorited
router.get('/:songId/check', favoriteController.checkFavorite);

// POST /favorites - Add to favorites
router.post('/', favoriteController.addFavorite);

// DELETE /favorites/:songId - Remove from favorites
router.delete('/:songId', favoriteController.removeFavorite);

// --- Artist Favorites Routes ---

// GET /favorites/artists - Get all favorite artists
router.get('/artists', favoriteController.getFavoriteArtists);

// GET /favorites/artist/:artistId/check - Check if artist is favorited
router.get('/artist/:artistId/check', favoriteController.checkFavoriteArtist);

// POST /favorites/artist/:artistId - Add artist to favorites
router.post('/artist/:artistId', favoriteController.addFavoriteArtist);

// DELETE /favorites/artist/:artistId - Remove artist from favorites
router.delete('/artist/:artistId', favoriteController.removeFavoriteArtist);

// --- Album Favorites Routes ---

// GET /favorites/albums - Get all favorite albums
router.get('/albums', favoriteController.getFavoriteAlbums);

// GET /favorites/album/:albumId/check - Check if album is favorited
router.get('/album/:albumId/check', favoriteController.checkFavoriteAlbum);

// POST /favorites/album/:albumId - Add album to favorites
router.post('/album/:albumId', favoriteController.addFavoriteAlbum);

// DELETE /favorites/album/:albumId - Remove album from favorites
router.delete('/album/:albumId', favoriteController.removeFavoriteAlbum);

module.exports = router;
