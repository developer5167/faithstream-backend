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

  // --- Artist Favorites Endpoints ---

  // GET /favorites/artists - Get all favorite artists
  async getFavoriteArtists(req, res) {
    try {
      const userId = req.user.id;
      const artists = await favoriteService.getUserFavoriteArtists(userId);

      res.json({
        success: true,
        artists: artists
      });
    } catch (error) {
      console.error('Error getting favorite artists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get favorite artists',
        error: error.message
      });
    }
  }

  // GET /favorites/artist/:artistId/check
  async checkFavoriteArtist(req, res) {
    try {
      const userId = req.user.id;
      const { artistId } = req.params;
      const isFavorite = await favoriteService.isFavoriteArtist(userId, artistId);
      res.json({ success: true, is_favorite: isFavorite });
    } catch (error) {
      console.error('Error checking favorite artist:', error);
      res.status(500).json({ success: false, message: 'Failed to check favorite status', error: error.message });
    }
  }

  // POST /favorites/artist/:artistId
  async addFavoriteArtist(req, res) {
    try {
      const userId = req.user.id;
      const { artistId } = req.params;
      await favoriteService.addFavoriteArtist(userId, artistId);
      res.status(201).json({ success: true, message: 'Artist added to favorites' });
    } catch (error) {
      console.error('Error adding favorite artist:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to add favorite artist', error: error.message });
    }
  }

  // DELETE /favorites/artist/:artistId
  async removeFavoriteArtist(req, res) {
    try {
      const userId = req.user.id;
      const { artistId } = req.params;
      await favoriteService.removeFavoriteArtist(userId, artistId);
      res.json({ success: true, message: 'Artist removed from favorites' });
    } catch (error) {
      console.error('Error removing favorite artist:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to remove favorite artist', error: error.message });
    }
  }

  // --- Album Favorites Endpoints ---

  // GET /favorites/albums - Get all favorite albums
  async getFavoriteAlbums(req, res) {
    try {
      const userId = req.user.id;
      const albums = await favoriteService.getUserFavoriteAlbums(userId);

      res.json({
        success: true,
        albums: albums
      });
    } catch (error) {
      console.error('Error getting favorite albums:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get favorite albums',
        error: error.message
      });
    }
  }

  // GET /favorites/album/:albumId/check
  async checkFavoriteAlbum(req, res) {
    try {
      const userId = req.user.id;
      const { albumId } = req.params;
      const isFavorite = await favoriteService.isFavoriteAlbum(userId, albumId);
      res.json({ success: true, is_favorite: isFavorite });
    } catch (error) {
      console.error('Error checking favorite album:', error);
      res.status(500).json({ success: false, message: 'Failed to check favorite status', error: error.message });
    }
  }

  // POST /favorites/album/:albumId
  async addFavoriteAlbum(req, res) {
    try {
      const userId = req.user.id;
      const { albumId } = req.params;
      await favoriteService.addFavoriteAlbum(userId, albumId);
      res.status(201).json({ success: true, message: 'Album added to favorites' });
    } catch (error) {
      console.error('Error adding favorite album:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to add favorite album', error: error.message });
    }
  }

  // DELETE /favorites/album/:albumId
  async removeFavoriteAlbum(req, res) {
    try {
      const userId = req.user.id;
      const { albumId } = req.params;
      await favoriteService.removeFavoriteAlbum(userId, albumId);
      res.json({ success: true, message: 'Album removed from favorites' });
    } catch (error) {
      console.error('Error removing favorite album:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to remove favorite album', error: error.message });
    }
  }
}

module.exports = new FavoriteController();
