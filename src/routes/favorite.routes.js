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

module.exports = router;
