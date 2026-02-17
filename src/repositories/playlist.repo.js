const db = require('../config/db');

class PlaylistRepository {
  // Get all playlists for a user
  async getUserPlaylists(userId) {
    const query = `
      SELECT 
        p.*,
        COUNT(ps.id) as song_count
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  // Get playlist by ID with songs
  async getPlaylistById(playlistId, userId = null) {
    // Get playlist info
    const playlistQuery = `
      SELECT * FROM playlists 
      WHERE id = $1 ${userId ? 'AND (user_id = $2 OR is_public = true)' : ''}
    `;
    const playlistParams = userId ? [playlistId, userId] : [playlistId];
    const playlistResult = await db.query(playlistQuery, playlistParams);
    
    if (playlistResult.rows.length === 0) {
      return null;
    }

    const playlist = playlistResult.rows[0];

    // Get songs in playlist
    const songsQuery = `
      SELECT 
        s.id, s.title, s.artist_user_id, s.album_id, 
        s.genre, s.published_at, s.audio_original_url,
        s.cover_image_url, s.created_at,
        ap.artist_name as artist_display_name,
        al.title as album_title,
        ps.position, ps.added_at
      FROM playlist_songs ps
      INNER JOIN songs s ON ps.song_id = s.id
      LEFT JOIN artist_profiles ap ON s.artist_user_id = ap.user_id
      LEFT JOIN albums al ON s.album_id = al.id
      WHERE ps.playlist_id = $1
      ORDER BY ps.position ASC, ps.added_at ASC
    `;
    const songsResult = await db.query(songsQuery, [playlistId]);

    return {
      ...playlist,
      songs: songsResult.rows
    };
  }

  // Create new playlist
  async createPlaylist(userId, name, description = null, isPublic = false) {
    const query = `
      INSERT INTO playlists (user_id, name, description, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [userId, name, description, isPublic]);
    return result.rows[0];
  }

  // Update playlist
  async updatePlaylist(playlistId, userId, updates) {
    const { name, description, isPublic } = updates;
    const query = `
      UPDATE playlists 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        is_public = COALESCE($3, is_public),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;
    const result = await db.query(query, [name, description, isPublic, playlistId, userId]);
    return result.rows[0];
  }

  // Delete playlist
  async deletePlaylist(playlistId, userId) {
    const query = 'DELETE FROM playlists WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await db.query(query, [playlistId, userId]);
    return result.rows[0];
  }

  // Add song to playlist
  async addSongToPlaylist(playlistId, songId, userId) {
    // First verify user owns the playlist
    const verifyQuery = 'SELECT id FROM playlists WHERE id = $1 AND user_id = $2';
    const verifyResult = await db.query(verifyQuery, [playlistId, userId]);
    
    if (verifyResult.rows.length === 0) {
      return null;
    }

    // Get max position
    const positionQuery = 'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM playlist_songs WHERE playlist_id = $1';
    const positionResult = await db.query(positionQuery, [playlistId]);
    const position = positionResult.rows[0].next_position;

    // Add song
    const query = `
      INSERT INTO playlist_songs (playlist_id, song_id, position)
      VALUES ($1, $2, $3)
      ON CONFLICT (playlist_id, song_id) DO NOTHING
      RETURNING id
    `;
    const result = await db.query(query, [playlistId, songId, position]);
    
    // Update playlist timestamp
    await db.query('UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [playlistId]);
    
    return result.rows[0];
  }

  // Remove song from playlist
  async removeSongFromPlaylist(playlistId, songId, userId) {
    // First verify user owns the playlist
    const verifyQuery = 'SELECT id FROM playlists WHERE id = $1 AND user_id = $2';
    const verifyResult = await db.query(verifyQuery, [playlistId, userId]);
    
    if (verifyResult.rows.length === 0) {
      return null;
    }

    const query = 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id';
    const result = await db.query(query, [playlistId, songId]);
    
    // Update playlist timestamp
    if (result.rows.length > 0) {
      await db.query('UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [playlistId]);
    }
    
    return result.rows[0];
  }

  // Check if song is in playlist
  async isSongInPlaylist(playlistId, songId) {
    const query = 'SELECT id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2';
    const result = await db.query(query, [playlistId, songId]);
    return result.rows.length > 0;
  }
}

module.exports = new PlaylistRepository();
