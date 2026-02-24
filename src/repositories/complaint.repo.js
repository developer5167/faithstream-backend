const db = require('../config/db');

exports.create = async (title, description, contentId, contentType, userId) => {
  await db.query(
    `INSERT INTO complaints (title, description, content_id, content_type, reported_by)
     VALUES ($1,$2,$3,$4,$5)`,
    [title, description, contentId, contentType, userId]
  );
};

exports.findByUser = async (userId) => {
  const res = await db.query(
    `SELECT 
      c.id, c.title, c.description, c.content_id, c.content_type, 
      c.status, c.admin_notes, c.created_at, c.updated_at,
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
      u.name AS reporter
    FROM complaints c
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
