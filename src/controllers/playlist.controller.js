const playlistService = require('../services/playlist.service');

class PlaylistController {
  // GET /playlists - Get all user playlists
  async getPlaylists(req, res) {
    try {
      const userId = req.user.id;
      const playlists = await playlistService.getUserPlaylists(userId);

      res.json({
        success: true,
        playlists: playlists,
        message: 'Playlists retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting playlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get playlists',
        error: error.message
      });
    }
  }

  // GET /playlists/:id - Get playlist by ID
  async getPlaylistById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const playlist = await playlistService.getPlaylistById(id, userId);

      res.json({
        success: true,
        playlist: playlist,
        message: 'Playlist retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting playlist:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get playlist',
        error: error.message
      });
    }
  }

  // POST /playlists - Create new playlist
  async createPlaylist(req, res) {
    try {
      const userId = req.user.id;
      const { name, description, is_public } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Playlist name is required'
        });
      }

      const playlist = await playlistService.createPlaylist(
        userId,
        name,
        description,
        is_public || false
      );

      res.status(201).json({
        success: true,
        playlist: playlist,
        message: 'Playlist created successfully'
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create playlist',
        error: error.message
      });
    }
  }

  // PUT /playlists/:id - Update playlist
  async updatePlaylist(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, description, is_public } = req.body;

      const updates = {
        name,
        description,
        isPublic: is_public
      };

      const playlist = await playlistService.updatePlaylist(id, userId, updates);

      res.json({
        success: true,
        playlist: playlist,
        message: 'Playlist updated successfully'
      });
    } catch (error) {
      console.error('Error updating playlist:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update playlist',
        error: error.message
      });
    }
  }

  // DELETE /playlists/:id - Delete playlist
  async deletePlaylist(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await playlistService.deletePlaylist(id, userId);

      res.json({
        success: true,
        message: 'Playlist deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete playlist',
        error: error.message
      });
    }
  }

  // POST /playlists/:id/songs - Add song to playlist
  async addSongToPlaylist(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { song_id } = req.body;

      if (!song_id) {
        return res.status(400).json({
          success: false,
          message: 'song_id is required'
        });
      }

      await playlistService.addSongToPlaylist(id, song_id, userId);

      res.status(201).json({
        success: true,
        message: 'Song added to playlist'
      });
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to add song to playlist',
        error: error.message
      });
    }
  }

  // DELETE /playlists/:id/songs/:songId - Remove song from playlist
  async removeSongFromPlaylist(req, res) {
    try {
      const userId = req.user.id;
      const { id, songId } = req.params;

      await playlistService.removeSongFromPlaylist(id, songId, userId);

      res.json({
        success: true,
        message: 'Song removed from playlist'
      });
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to remove song from playlist',
        error: error.message
      });
    }
  }
}


module.exports = new PlaylistController();
