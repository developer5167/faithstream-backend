const playlistRepo = require('../repositories/playlist.repo');
const songRepo = require('../repositories/song.repo');

class PlaylistService {
  async getUserPlaylists(userId) {
    const playlists = await playlistRepo.getUserPlaylists(userId);
    
    // Add songs to each playlist
    const playlistsWithSongs = await Promise.all(
      playlists.map(async (playlist) => {
        const fullPlaylist = await playlistRepo.getPlaylistById(playlist.id, userId);
        return fullPlaylist;
      })
    );

    return playlistsWithSongs;
  }

  async getPlaylistById(playlistId, userId) {
    const playlist = await playlistRepo.getPlaylistById(playlistId, userId);
    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }
    return playlist;
  }

  async createPlaylist(userId, name, description, isPublic) {
    if (!name || name.trim().length === 0) {
      throw new Error('Playlist name is required');
    }

    const playlist = await playlistRepo.createPlaylist(userId, name.trim(), description, isPublic);
    
    // Return with empty songs array
    return {
      ...playlist,
      songs: []
    };
  }

  async updatePlaylist(playlistId, userId, updates) {
    const playlist = await playlistRepo.updatePlaylist(playlistId, userId, updates);
    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }
    
    // Get full playlist with songs
    return await this.getPlaylistById(playlistId, userId);
  }

  async deletePlaylist(playlistId, userId) {
    const result = await playlistRepo.deletePlaylist(playlistId, userId);
    if (!result) {
      throw new Error('Playlist not found or access denied');
    }
    return result;
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    // Verify song exists
    const song = await songRepo.getSongById(songId);
    if (!song) {
      throw new Error('Song not found');
    }

    const result = await playlistRepo.addSongToPlaylist(playlistId, songId, userId);
    if (!result) {
      throw new Error('Playlist not found or access denied');
    }
    return result;
  }

  async removeSongFromPlaylist(playlistId, songId, userId) {
    const result = await playlistRepo.removeSongFromPlaylist(playlistId, songId, userId);
    if (!result) {
      throw new Error('Playlist not found, song not in playlist, or access denied');
    }
    return result;
  }

  async isSongInPlaylist(playlistId, songId) {
    return await playlistRepo.isSongInPlaylist(playlistId, songId);
  }
}

module.exports = new PlaylistService();
