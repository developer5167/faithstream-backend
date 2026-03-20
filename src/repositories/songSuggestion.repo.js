const db = require('../config/db');

exports.create = async (data) => {
  const res = await db.query(
    `INSERT INTO song_suggestions (song_name, ministry_name, singer_name, album_name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.song_name, data.ministry_name, data.singer_name, data.album_name]
  );
  return res.rows[0];
};

exports.findAll = async () => {
  const res = await db.query(
    `SELECT * FROM song_suggestions ORDER BY created_at DESC`
  );
  return res.rows;
};

exports.delete = async (id) => {
  await db.query(`DELETE FROM song_suggestions WHERE id = $1`, [id]);
};
