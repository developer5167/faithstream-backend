const db = require('../config/db');

exports.findOpen = async () => {
  const res = await db.query(
    `SELECT 
      sd.*,
      s1.title as song_a_title,
      ap1.artist_name as artist_a_name,
      s2.title as song_b_title,
      ap2.artist_name as artist_b_name
    FROM song_disputes sd
    LEFT JOIN songs s1 ON sd.song_id = s1.id
    LEFT JOIN artist_profiles ap1 ON s1.artist_user_id = ap1.user_id
    LEFT JOIN songs s2 ON sd.song_id = s2.id
    LEFT JOIN artist_profiles ap2 ON s2.artist_user_id = ap2.user_id
    WHERE sd.status='OPEN'`
  );
  return res.rows;
};

exports.findById = async (id) => {
  const res = await db.query(
    `SELECT * FROM song_disputes WHERE id=$1`,
    [id]
  );
  return res.rows[0];
};

exports.markResolved = async (id) => {
  await db.query(
    `UPDATE song_disputes SET status='RESOLVED', resolved_at=now()
     WHERE id=$1`,
    [id]
  );
};
