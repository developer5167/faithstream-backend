const favoriteService = require('../services/favorite.service');
const playlistService = require('../services/playlist.service');

class LibraryController {
  async getLibraryBootstrap(req, res) {
    try {
      const userId = req.user.id;

      // Run all service calls in parallel for better performance
      const [favorites, playlists, artists, albums] = await Promise.all([
        favoriteService.getUserFavorites(userId),
        playlistService.getUserPlaylists(userId),
        favoriteService.getUserFavoriteArtists(userId),
        favoriteService.getUserFavoriteAlbums(userId)
      ]);

      res.json({
        success: true,
        favorites: favorites,
        playlists: playlists,
        artists: artists,
        albums: albums,
        message: 'Library bootstrap data retrieved successfully'
      });
    } catch (error) {
      console.error('Error in Library Bootstrap:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve library bootstrap data',
        error: error.message
      });
    }
  }
}

module.exports = new LibraryController();
