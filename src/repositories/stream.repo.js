const db = require('../config/db');

exports.create = async (songId, userId, duration) => {
  await db.query(
    `INSERT INTO streams (song_id, user_id, duration_seconds)
     VALUES ($1,$2,$3)`,
    [songId, userId, duration]
  );
};
exports.getMonthlyArtistStreams = async (month) => {
  const res = await db.query(
    `
    SELECT s.artist_user_id, COUNT(st.id) AS streams
    FROM streams st
    JOIN songs s ON s.id = st.song_id
    WHERE to_char(st.played_at, 'YYYY-MM') = $1
    GROUP BY s.artist_user_id
    `,
    [month]
  );

  return res.rows;
};

exports.getTotalStreamsForMonth = async (month) => {
  const res = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM streams
    WHERE to_char(played_at, 'YYYY-MM') = $1
    `,
    [month]
  );

  return parseInt(res.rows[0].total);
};

