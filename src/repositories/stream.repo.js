const db = require('../config/db');

exports.create = async (songId, userId, duration) => {
  await db.query(
    `INSERT INTO streams (song_id, user_id, duration_seconds)
     VALUES ($1,$2,$3)`,
    [songId, userId, duration]
  );
};

exports.getDailyPlayCount = async (userId, songId) => {
  const res = await db.query(
    `SELECT COUNT(*) AS count
     FROM streams
     WHERE user_id = $1
       AND song_id = $2
       AND played_at >= NOW() - INTERVAL '24 hours'`,
    [userId, songId]
  );
  return parseInt(res.rows[0].count);
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

exports.getArtistMonthlySummary = async (artistUserId, month) => {
  const res = await db.query(
    `
    SELECT
      s.id          AS song_id,
      s.title       AS song_title,
      COUNT(st.id)  AS stream_count
    FROM streams st
    JOIN songs s ON s.id = st.song_id
    WHERE s.artist_user_id = $1
      AND ($2::TEXT IS NULL OR to_char(st.played_at, 'YYYY-MM') = $2)
    GROUP BY s.id, s.title
    ORDER BY stream_count DESC
    `,
    [artistUserId, month || null]
  );
  return res.rows;
};

exports.getMonthlyRevenue = async (month) => {
  const res = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM subscriptions
     WHERE to_char(started_at, 'YYYY-MM') = $1
       AND status = 'ACTIVE'`,
    [month]
  );
  return parseFloat(res.rows[0].total);
};
