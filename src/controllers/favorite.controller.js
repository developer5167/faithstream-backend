const favoriteService = require('../services/favorite.service');

class FavoriteController {
  // GET /favorites - Get all user favorites
  async getFavorites(req, res) {
    try {
      const userId = req.user.id;
      const favorites = await favoriteService.getUserFavorites(userId);

      res.json({
        success: true,
        favorites: favorites,
        message: 'Favorites retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting favorites:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get favorites',
        error: error.message
      });
    }
  }

  // GET /favorites/:songId/check - Check if song is favorited
  async checkFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { songId } = req.params;

      const isFavorite = await favoriteService.isFavorite(userId, songId);

      res.json({
        success: true,
        is_favorite: isFavorite
      });
    } catch (error) {
      console.error('Error checking favorite:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check favorite status',
        error: error.message
      });
    }
  }

  // POST /favorites - Add song to favorites
  async addFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { song_id } = req.body;

      if (!song_id) {
        return res.status(400).json({
          success: false,
          message: 'song_id is required'
        });
      }

      await favoriteService.addFavorite(userId, song_id);

      res.status(201).json({
        success: true,
        message: 'Song added to favorites'
      });
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add favorite',
        error: error.message
      });
    }
  }

  // DELETE /favorites/:songId - Remove song from favorites
  async removeFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { songId } = req.params;

      await favoriteService.removeFavorite(userId, songId);

      res.json({
        success: true,
        message: 'Song removed from favorites'
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove favorite',
        error: error.message
      });
    }
  }
}

module.exports = new FavoriteController();
