const db = require('../config/db');

exports.create = async (data) => {
  const res = await db.query(
    `INSERT INTO songs
     (artist_user_id, album_id, title, language, genre, lyrics, description, audio_original_url, cover_image_url, track_number)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      data.artist_user_id,
      data.album_id,
      data.title,
      data.language,
      data.genre,
      data.lyrics,
      data.description,
      data.audio_original_url,
      data.cover_image_url,
      data.track_number
    ]
  );
  return res.rows[0];
};

exports.findByArtist = async (artistId) => {
  const res = await db.query(
    `SELECT * FROM songs WHERE artist_user_id=$1 ORDER BY created_at DESC`,
    [artistId]
  );
  return res.rows;
};

exports.findByAlbum = async (albumId) => {
  const res = await db.query(
    `SELECT * FROM songs WHERE album_id=$1 ORDER BY track_number ASC, created_at ASC`,
    [albumId]
  );
  return res.rows;
};

exports.markAlbumSongsPending = async (albumId) => {
  await db.query(
    `UPDATE songs SET status='PENDING' WHERE album_id=$1`,
    [albumId]
  );
};

exports.findPending = async () => {
  const res = await db.query(
    `SELECT s.*, u.name AS artist_name
     FROM songs s
     JOIN users u ON u.id=s.artist_user_id
     WHERE s.status='PENDING'
     ORDER BY s.created_at`,
  );
  return res.rows;
};

exports.findPendingIndividualSongs = async () => {
  const res = await db.query(
    `SELECT s.*, u.name AS artist_name
     FROM songs s
     JOIN users u ON u.id=s.artist_user_id
     WHERE s.status='PENDING' AND s.album_id IS NULL
     ORDER BY s.created_at`,
  );
  return res.rows;
};

exports.findPendingAlbumSongs = async () => {
  const res = await db.query(
    `SELECT s.*, u.name AS artist_name, a.title AS album_title
     FROM songs s
     JOIN users u ON u.id=s.artist_user_id
     LEFT JOIN albums a ON a.id=s.album_id
     WHERE s.status='PENDING' AND s.album_id IS NOT NULL
     ORDER BY s.created_at`,
  );
  return res.rows;
};

exports.updateStatus = async (songId, status) => {
  await db.query(
    `UPDATE songs SET status=$2, published_at=now() WHERE id=$1`,
    [songId, status]
  );
};

exports.reject = async (songId, reason) => {
  await db.query(
    `UPDATE songs SET status='REJECTED', reject_reason=$2 WHERE id=$1`,
    [songId, reason]
  );
};

exports.update = async (songId, data) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  // Build dynamic update query based on provided fields
  if (data.title !== undefined) {
    fields.push(`title=$${paramIndex++}`);
    values.push(data.title);
  }
  if (data.language !== undefined) {
    fields.push(`language=$${paramIndex++}`);
    values.push(data.language);
  }
  if (data.genre !== undefined) {
    fields.push(`genre=$${paramIndex++}`);
    values.push(data.genre);
  }
  if (data.lyrics !== undefined) {
    fields.push(`lyrics=$${paramIndex++}`);
    values.push(data.lyrics);
  }
  if (data.description !== undefined) {
    fields.push(`description=$${paramIndex++}`);
    values.push(data.description);
  }
  if (data.audio_original_url !== undefined) {
    fields.push(`audio_original_url=$${paramIndex++}`);
    values.push(data.audio_original_url);
  }
  if (data.cover_image_url !== undefined) {
    fields.push(`cover_image_url=$${paramIndex++}`);
    values.push(data.cover_image_url);
  }
  if (data.track_number !== undefined) {
    fields.push(`track_number=$${paramIndex++}`);
    values.push(data.track_number);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(songId);
  const query = `UPDATE songs SET ${fields.join(', ')} WHERE id=$${paramIndex} RETURNING *`;
  const res = await db.query(query, values);
  return res.rows[0];
};

exports.getSongById = async (songId) => {
  const res = await db.query(
    `SELECT * FROM songs WHERE id=$1`,
    [songId]
  );
  return res.rows[0];
};

exports.findApprovedById = async (songId) => {
  const res = await db.query(
    `SELECT * FROM songs WHERE id=$1 AND status='APPROVED'`,
    [songId]
  );
  return res.rows[0];
};

exports.getPopularSongs = async (limit = 20) => {
  const res = await db.query(
    `SELECT 
       s.id,
       s.title,
       s.description,
       s.genre,
       s.language,
       s.artist_user_id,
      s.audio_original_url,
      s.created_at,
      COALESCE(
        s.cover_image_url,
        a.cover_image_url,
        ap.profile_image_url,
        u.profile_pic_url
      ) as image,
      a.title as album_title,
       u.name as artist_name,
       ap.artist_name as artist_display_name,
       COALESCE(stream_counts.count, 0) as stream_count
     FROM songs s
     JOIN users u ON u.id = s.artist_user_id
     LEFT JOIN albums a ON a.id = s.album_id
     LEFT JOIN artist_profiles ap ON ap.user_id = s.artist_user_id
     LEFT JOIN (
       SELECT song_id, COUNT(*) as count
       FROM streams
       GROUP BY song_id
     ) stream_counts ON stream_counts.song_id = s.id
     WHERE s.status = 'APPROVED'
     ORDER BY stream_counts.count DESC NULLS LAST, s.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
};
