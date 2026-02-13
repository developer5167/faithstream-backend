const db = require('../config/db');

/**
 * Insert or update recently played song for a user
 * Uses ON CONFLICT to update played_at if song already exists in user's recently played
 */
exports.upsert = async (userId, songId) => {
  await db.query(
    `INSERT INTO recently_played (user_id, song_id, played_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, song_id)
     DO UPDATE SET played_at = CURRENT_TIMESTAMP`,
    [userId, songId]
  );
};

/**
 * Get user's recently played songs with song details
 * @param {number} userId - User ID
 * @param {number} limit - Number of songs to fetch (default 20)
 */
exports.getRecentlyPlayed = async (userId, limit = 20) => {
  const res = await db.query(
    `SELECT 
      s.id,
      s.title,
      s.description,
      s.genre,
      s.language,
      s.artist_user_id,
      s.audio_original_url,
      COALESCE(
        s.cover_image_url,
        a.cover_image_url,
        ap.profile_image_url,
        u.profile_pic_url
      ) AS image,
      a.title AS album_title,
      u.name AS artist_name,
      ap.artist_name AS artist_display_name,
      ap.profile_image_url AS artist_image,
      rp.played_at
     FROM recently_played rp
     JOIN songs s ON s.id = rp.song_id
     JOIN users u ON u.id = s.artist_user_id
     LEFT JOIN albums a ON a.id = s.album_id
     LEFT JOIN artist_profiles ap ON ap.user_id = s.artist_user_id
     WHERE rp.user_id = $1 AND s.status = 'APPROVED'
     ORDER BY rp.played_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return res.rows;
};

/**
 * Clear user's recently played history
 */
exports.clearUserHistory = async (userId) => {
  await db.query(
    `DELETE FROM recently_played WHERE user_id = $1`,
    [userId]
  );
};

/**
 * Remove specific song from user's recently played
 */
exports.removeSong = async (userId, songId) => {
  await db.query(
    `DELETE FROM recently_played WHERE user_id = $1 AND song_id = $2`,
    [userId, songId]
  );
};
