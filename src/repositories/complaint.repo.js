const db = require('../config/db');

exports.create = async (songId, userId, reason) => {
  await db.query(
    `INSERT INTO complaints (song_id, reported_by, reason)
     VALUES ($1,$2,$3)`,
    [songId, userId, reason]
  );
};

exports.findByUser = async (userId) => {
  const res = await db.query(
    `SELECT 
      c.id,
      c.reason,
      c.status,
      c.created_at,
      s.id AS song_id,
      s.title AS song_title,
      u.name AS artist_name
     FROM complaints c
     JOIN songs s ON s.id = c.song_id
     JOIN users u ON u.id = s.artist_user_id
     WHERE c.reported_by = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return res.rows;
};

exports.findOpen = async () => {
  const res = await db.query(
    `
    SELECT c.*, s.title AS song_title, u.name AS reporter
    FROM complaints c
    JOIN songs s ON s.id=c.song_id
    JOIN users u ON u.id=c.reported_by
    WHERE c.status='OPEN'
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
    `UPDATE complaints SET status='RESOLVED' WHERE id=$1`,
    [id]
  );
};
