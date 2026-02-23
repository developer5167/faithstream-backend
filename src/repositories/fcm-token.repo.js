const pool = require('../config/db');

exports.upsertToken = async (userId, token) => {
  const query = `
    INSERT INTO user_fcm_tokens (user_id, fcm_token, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET fcm_token = EXCLUDED.fcm_token, updated_at = NOW()
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, token]);
  return result.rows[0];
};

exports.getToken = async (userId) => {
  const query = `SELECT fcm_token FROM user_fcm_tokens WHERE user_id = $1`;
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.fcm_token || null;
};

exports.deleteToken = async (userId) => {
  const query = `DELETE FROM user_fcm_tokens WHERE user_id = $1`;
  await pool.query(query, [userId]);
};
