const db = require('../config/db');

exports.create = async ({ artist_user_id, month, total_streams, amount }) => {
  await db.query(
    `
    INSERT INTO artist_earnings
      (artist_user_id, month, total_streams, amount)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (artist_user_id, month)
    DO NOTHING
    `,
    [artist_user_id, month, total_streams, amount]
  );
};
exports.getAll = async () => {
  const res = await db.query(
    `SELECT 
      ae.*, 
      ap.artist_name 
    FROM artist_earnings ae
    LEFT JOIN artist_profiles ap ON ae.artist_user_id = ap.user_id
    ORDER BY ae.created_at DESC`
  );
  return res.rows;
};

exports.markPaid = async (id) => {
  await db.query(
    `UPDATE artist_earnings SET status='PAID' WHERE id=$1`,
    [id]
  );
};
