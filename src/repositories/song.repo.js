const db = require('../config/db');
const s3Util = require('../utils/s3.util');

exports.create = async (data) => {
  const res = await db.query(
    `INSERT INTO songs
     (artist_user_id, album_id, title, language, genre, lyrics, description, audio_original_url, cover_image_url, track_number, singer)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
      data.track_number,
      data.singer
    ]
  );
  return res.rows[0];
};

exports.findByArtist = async (artistId) => {
  const res = await db.query(
    `SELECT * FROM songs WHERE artist_user_id=$1 AND status NOT IN ('REJECTED', 'MERGED') ORDER BY created_at DESC`,
    [artistId]
  );
  return res.rows;
};

exports.findPublicByArtist = async (artistId) => {
  try{
  const res = await db.query(
    `SELECT s.*, 
            a.title as album_title,
            u.name as artist_name,
            ap.artist_name as artist_display_name
     FROM songs s
     JOIN users u ON u.id = s.artist_user_id
     LEFT JOIN albums a ON a.id = s.album_id
     LEFT JOIN artist_profiles ap ON ap.user_id = s.artist_user_id
     WHERE s.artist_user_id=$1 AND s.status='APPROVED' 
     ORDER BY s.created_at DESC`,
    [artistId]
  );
  return res.rows;
}catch(error){
  console.log(error);
}
};

exports.findByAlbum = async (albumId) => {
  const res = await db.query(
    `SELECT * FROM songs WHERE album_id=$1 AND status NOT IN ('REJECTED', 'MERGED') ORDER BY track_number ASC, created_at ASC`,
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

exports.markAlbumSongsApproved = async (albumId) => {
  await db.query(
    `UPDATE songs SET status='APPROVED', published_at=now() WHERE album_id=$1`,
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
  if (data.singer !== undefined) {
    fields.push(`singer=$${paramIndex++}`);
    values.push(data.singer);
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

exports.delete = async (songId) => {
  await db.query(`DELETE FROM songs WHERE id=$1`, [songId]);
};

exports.deleteByAlbumId = async (albumId) => {
  await db.query(`DELETE FROM songs WHERE album_id=$1`, [albumId]);
};

exports.findFullDetailsById = async (songId) => {
  const res = await db.query(
    `SELECT 
       s.*,
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
     WHERE s.id = $1 AND s.status = 'APPROVED'`,
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
       s.lyrics,
       s.singer,
       s.artist_user_id,
       s.audio_original_url,
       s.audio_processed_url,
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
       WHERE played_at >= NOW() - INTERVAL '30 days'
       GROUP BY song_id
     ) stream_counts ON stream_counts.song_id = s.id
     WHERE s.status = 'APPROVED'
     ORDER BY stream_counts.count DESC NULLS LAST, s.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
};

exports.getTopPlayedSongs = async (limit = 10) => {
  const res = await db.query(
    `SELECT 
       s.id,
       s.title,
       s.description,
       s.genre,
       s.language,
       s.lyrics,
       s.singer,
       s.artist_user_id,
       s.audio_original_url,
       s.audio_processed_url,
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

exports.wipeSongFilesFromS3 = async (songId) => {
  try {
    const res = await db.query(
      `SELECT audio_original_url, audio_processed_url, cover_image_url FROM songs WHERE id = $1`,
      [songId]
    );
    if (res.rows.length > 0) {
      const { audio_original_url, audio_processed_url, cover_image_url } = res.rows[0];
      if (audio_original_url) await s3Util.deleteFromS3ByUrl(audio_original_url);
      if (audio_processed_url) await s3Util.deleteFromS3ByUrl(audio_processed_url);
      if (cover_image_url) await s3Util.deleteFromS3ByUrl(cover_image_url);
    }
  } catch (err) {
    console.error('Error wiping song files from S3:', err);
  }
};

exports.mergeSongs = async (masterId, duplicateId) => {
  console.log('Merging songs:', masterId, duplicateId);
const { validate: isUuid } = require('uuid');

if (!isUuid(masterId) || !isUuid(duplicateId)) {
  throw new Error('Invalid UUID provided');
}
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Transfer streams
    await client.query(
      `UPDATE streams 
       SET song_id = $1 
       WHERE song_id = $2`,
      [masterId, duplicateId]
    );

    // 2. Transfer favorites
    await client.query(
      `INSERT INTO favorites (user_id, song_id, created_at)
       SELECT user_id, $1, created_at
       FROM favorites
       WHERE song_id = $2
       ON CONFLICT (user_id, song_id) DO NOTHING`,
      [masterId, duplicateId]
    );

    await client.query(
      `DELETE FROM favorites WHERE song_id = $1`,
      [duplicateId]
    );

    // 3. Transfer playlist songs
    await client.query(
      `INSERT INTO playlist_songs (playlist_id, song_id, position, added_at)
       SELECT playlist_id, $1, position, added_at
       FROM playlist_songs
       WHERE song_id = $2
       ON CONFLICT (playlist_id, song_id) DO NOTHING`,
      [masterId, duplicateId]
    );

    await client.query(
      `DELETE FROM playlist_songs WHERE song_id = $1`,
      [duplicateId]
    );

    // 4. Mark duplicate as MERGED
    await client.query(
      `UPDATE songs SET status = 'MERGED' WHERE id = $1`,
      [duplicateId]
    );

    await client.query('COMMIT');
    
    // 5. Physically wipe duplicate's S3 files to prevent junk data (Hybrid Approach)
    await exports.wipeSongFilesFromS3(duplicateId);
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.log('Error merging songs:', e);
    throw e;
  } finally {
    client.release();
  }
};

exports.findPotentialDuplicates = async () => {
  const res = await db.query(
    `SELECT s1.id as song1_id, s1.title as title1, s1.artist_user_id as artist1_id, u1.name as artist1_name,
            s2.id as song2_id, s2.title as title2, s2.artist_user_id as artist2_id, u2.name as artist2_name
     FROM songs s1
     JOIN songs s2 ON LOWER(TRIM(s1.title)) = LOWER(TRIM(s2.title)) AND s1.id < s2.id
     JOIN users u1 ON s1.artist_user_id = u1.id
     JOIN users u2 ON s2.artist_user_id = u2.id
     WHERE s1.status = 'APPROVED' AND s2.status = 'APPROVED'
     AND s1.artist_user_id != s2.artist_user_id`
  );
  return res.rows;
};
