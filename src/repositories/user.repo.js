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

exports.saveToken = async (userId, token) => {
  await db.query(
    `INSERT INTO user_tokens (user_id, token, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, token) DO NOTHING`,
    [userId, token]
  );
};

exports.removeToken = async (userId, token) => {
  await db.query(
    `DELETE FROM user_tokens WHERE user_id=$1 AND token=$2`,
    [userId, token]
  );
};

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
     JOIN artist_profiles ap ON ap.user_id = u.id
     WHERE ap.verification_status = 'APPROVED'
     ORDER BY ap.artist_name ASC`
  );
  return res.rows;
};
