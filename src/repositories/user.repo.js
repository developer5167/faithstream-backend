const e = require('express');
const db = require('../config/db');

exports.createUser = async (name, email, hash) => {
  const res = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1,$2,$3)
     RETURNING id, name, email, artist_status, is_admin, created_at`,
    [name, email, hash]
  );
  return res.rows[0];
};

exports.findByEmail = async (email) => {
  console.log(email);
  
  const res = await db.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );
  return res.rows[0];
};
exports.updateArtistStatus = async (userId, status) => {
  await db.query(
    `UPDATE users SET artist_status=$2 WHERE id=$1`,
    [userId, status]
  );
};
exports.findById = async (id) => {
  const res = await db.query(`SELECT * FROM users WHERE id=$1`, [id]);
  return res.rows[0];
};

exports.updatePassword = async (userId, hash) => {
  await db.query(
    `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
    [userId, hash]
  );
};

// (Phase 4): JWTs are now purely cryptographic + Redis Blocklist managed
// exports.saveToken and exports.removeToken have been dropped to save Database write-cycles.

exports.updateProfile = async (userId, updates) => {
  const { name, phone, bio, profile_pic_url } = updates;
  
  const res = await db.query(
    `UPDATE users 
     SET name = COALESCE($2, name),
         phone = COALESCE($3, phone),
         bio = COALESCE($4, bio),
         profile_pic_url = COALESCE($5, profile_pic_url),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, phone, bio, profile_pic_url, artist_status, is_admin, created_at, updated_at`,
    [userId, name, phone, bio, profile_pic_url]
  );
  
  return res.rows[0];
};

exports.getVerifiedArtists = async () => {
  const res = await db.query(
    `SELECT u.id, u.name, u.email, ap.artist_name, ap.bio, u.created_at
     FROM users u
     ORDER BY ap.artist_name ASC`
  );
  return res.rows;
};

exports.incrementCopyrightStrikes = async (userId) => {
  const res = await db.query(
    `UPDATE users 
     SET copyright_strikes = copyright_strikes + 1,
         is_blocked = CASE WHEN copyright_strikes + 1 >= 3 THEN true ELSE is_blocked END
     WHERE id = $1
     RETURNING copyright_strikes, is_blocked`,
    [userId]
  );
  
  if (res.rows[0].is_blocked) {
    await db.query(`DELETE FROM user_tokens WHERE user_id = $1`, [userId]);
  }
  
  return res.rows[0];
};
