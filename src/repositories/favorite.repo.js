const db = require('../config/db');

class FavoriteRepository {
  // Get all favorites for a user
  async getUserFavorites(userId) {
    const query = `
      SELECT 
        s.id, s.title, s.artist_user_id, s.album_id, 
        s.genre, s.published_at,
        s.cover_image_url, s.created_at,              
        a.artist_name,
        al.title as album_title
      FROM favorites f
      INNER JOIN songs s ON f.song_id = s.id
      LEFT JOIN artist_profiles a ON s.artist_user_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  // Check if song is favorited by user
  async isFavorite(userId, songId) {
    const query = 'SELECT id FROM favorites WHERE user_id = $1 AND song_id = $2';
    const result = await db.query(query, [userId, songId]);
    return result.rows.length > 0;
  }

  // Add song to favorites
  async addFavorite(userId, songId) {
    const query = `
      INSERT INTO favorites (user_id, song_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, song_id) DO NOTHING
      RETURNING id
    `;
    const result = await db.query(query, [userId, songId]);
    return result.rows[0];
  }

  // Remove song from favorites
  async removeFavorite(userId, songId) {
    const query = 'DELETE FROM favorites WHERE user_id = $1 AND song_id = $2 RETURNING id';
    const result = await db.query(query, [userId, songId]);
    return result.rows[0];
  }

  // Get favorite count for a song
  async getFavoriteCount(songId) {
    const query = 'SELECT COUNT(*) as count FROM favorites WHERE song_id = $1';
    const result = await db.query(query, [songId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = new FavoriteRepository();
