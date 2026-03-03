const db = require('../config/db');

exports.create = async (title, description, contentId, contentType, userId, artistName, songName, albumName) => {
  await db.query(
    `INSERT INTO complaints (title, description, content_id, content_type, reported_by, artist_name, song_name, album_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [title, description, contentId, contentType, userId, artistName, songName, albumName]
  );
};

exports.findByUser = async (userId) => {
  const res = await db.query(
    `SELECT 
      c.id, c.title, c.description, c.content_id, c.content_type, 
      c.status, c.admin_notes, c.created_at, c.updated_at,
      c.artist_name, c.song_name, c.album_name,
      u.name AS reporter
     FROM complaints c
     JOIN users u ON u.id = c.reported_by
     WHERE c.reported_by = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return res.rows;
};

exports.findOpen = async () => {
  const res = await db.query(
    `
    SELECT 
      c.id, c.title, c.description, c.content_id, c.content_type, 
      c.status, c.admin_notes, c.created_at, c.updated_at,
      c.artist_name, c.song_name, c.album_name,
      u.name AS reporter
    FROM complaints c
    JOIN users u ON u.id=c.reported_by
    ORDER BY c.created_at DESC
    `
  );
  return res.rows;
};

exports.findById = async (id) => {
  const res = await db.query(
    `SELECT * FROM complaints WHERE id=$1`,
    [id]
  );
  return res.rows[0];
};

exports.markResolved = async (id) => {
  await db.query(
    `UPDATE complaints SET status='RESOLVED', updated_at=now() WHERE id=$1`,
    [id]
  );
};

exports.linkContent = async (complaintId, contentId, contentType) => {
  await db.query(
    `UPDATE complaints SET content_id=$2, content_type=$3, updated_at=now() WHERE id=$1`,
    [complaintId, contentId, contentType]
  );
};
