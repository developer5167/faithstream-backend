const db = require('../config/db');

class FavoriteRepository {
  // Get all favorites for a user
  async getUserFavorites(userId) {
    const query = `
      SELECT 
        s.id, s.title, s.artist_user_id, s.album_id, 
        s.genre, s.published_at, s.audio_original_url,
        s.cover_image_url, s.created_at,              
        ap.artist_name as artist_display_name,
        al.title as album_title
      FROM favorites f
      INNER JOIN songs s ON f.song_id = s.id
      LEFT JOIN artist_profiles ap ON s.artist_user_id = ap.user_id
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
  // --- Artist Favorites ---

  // Check if artist is favorited by user
  async isFavoriteArtist(userId, artistId) {
    const query = 'SELECT id FROM favorite_artists WHERE user_id = $1 AND artist_user_id = $2';
    const result = await db.query(query, [userId, artistId]);
    return result.rows.length > 0;
  }

  // Add artist to favorites
  async addFavoriteArtist(userId, artistId) {
    const query = `
      INSERT INTO favorite_artists (user_id, artist_user_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, artist_user_id) DO NOTHING
      RETURNING id
    `;
    const result = await db.query(query, [userId, artistId]);
    return result.rows[0];
  }

  // Remove artist from favorites
  async removeFavoriteArtist(userId, artistId) {
    const query = 'DELETE FROM favorite_artists WHERE user_id = $1 AND artist_user_id = $2 RETURNING id';
    const result = await db.query(query, [userId, artistId]);
    return result.rows[0];
  }

  // Get all favorite artists for a user
  async getUserFavoriteArtists(userId) {
    const query = `
      SELECT 
        u.id, 
        COALESCE(ap.artist_name, u.name) as name, 
        ap.bio, 
        COALESCE(NULLIF(u.profile_pic_url, ''), NULLIF(ap.profile_image_url, '')) as profile_image_url,
        u.profile_pic_url as profile_pic_url,
        COALESCE(NULLIF(u.profile_pic_url, ''), NULLIF(ap.profile_image_url, '')) as image,
        fa.created_at as favorited_at,
        (SELECT COUNT(*)::INT FROM songs s WHERE s.artist_user_id = u.id AND s.status = 'APPROVED') as song_count,
        (SELECT COUNT(*)::INT FROM albums a WHERE a.artist_user_id = u.id AND a.status = 'APPROVED') as album_count
      FROM favorite_artists fa
      JOIN artist_profiles ap ON fa.artist_user_id = ap.user_id
      JOIN users u ON u.id = ap.user_id
      WHERE fa.user_id = $1
      ORDER BY fa.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  // --- Album Favorites ---

  // Check if album is favorited by user
  async isFavoriteAlbum(userId, albumId) {
    const query = 'SELECT id FROM favorite_albums WHERE user_id = $1 AND album_id = $2';
    const result = await db.query(query, [userId, albumId]);
    return result.rows.length > 0;
  }

  // Add album to favorites
  async addFavoriteAlbum(userId, albumId) {
    const query = `
      INSERT INTO favorite_albums (user_id, album_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, album_id) DO NOTHING
      RETURNING id
    `;
    const result = await db.query(query, [userId, albumId]);
    return result.rows[0];
  }

  // Remove album from favorites
  async removeFavoriteAlbum(userId, albumId) {
    const query = 'DELETE FROM favorite_albums WHERE user_id = $1 AND album_id = $2 RETURNING id';
    const result = await db.query(query, [userId, albumId]);
    return result.rows[0];
  }

  // Get all favorite albums for a user
  async getUserFavoriteAlbums(userId) {
    const query = `
      SELECT 
        al.id, al.title, al.description, 
        NULLIF(al.cover_image_url, '') as cover_image_url, 
        NULLIF(al.cover_image_url, '') as image,
        al.release_type, al.artist_user_id,
        ap.artist_name,
        fa.created_at as favorited_at
      FROM favorite_albums fa
      JOIN albums al ON fa.album_id = al.id
      LEFT JOIN artist_profiles ap ON al.artist_user_id = ap.user_id
      WHERE fa.user_id = $1
      ORDER BY fa.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }
}

module.exports = new FavoriteRepository();
