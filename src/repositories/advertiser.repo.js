const db = require('../config/db');

exports.createAdvertiser = async (companyName, email, hash, phone) => {
  const res = await db.query(
    `INSERT INTO advertisers (company_name, email, password_hash, phone, email_verified)
     VALUES ($1,$2,$3,$4, TRUE)
     RETURNING id, company_name, email, phone, status, created_at, email_verified`,
    [companyName, email, hash, phone]
  );
  return res.rows[0];
};

exports.findByEmail = async (email) => {
  const res = await db.query(
    `SELECT * FROM advertisers WHERE email=$1`,
    [email]
  );
  return res.rows[0];
};

exports.findById = async (id) => {
  const res = await db.query(`SELECT * FROM advertisers WHERE id=$1`, [id]);
  return res.rows[0];
};

exports.saveToken = async (advertiserId, token) => {
  await db.query(
    `INSERT INTO advertiser_tokens (advertiser_id, token, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (advertiser_id, token) DO NOTHING`,
    [advertiserId, token]
  );
};

exports.removeToken = async (advertiserId, token) => {
  await db.query(
    `DELETE FROM advertiser_tokens WHERE advertiser_id=$1 AND token=$2`,
    [advertiserId, token]
  );
};
