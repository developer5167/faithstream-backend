const db = require('../config/db');

exports.hasActiveSubscription = async (userId) => {
  const res = await db.query(
    `SELECT 1 FROM subscriptions
     WHERE user_id=$1 AND status='ACTIVE' AND expires_at > now()`,
    [userId]
  );
  return res.rowCount > 0;
};

exports.activate = async (userId, start, end) => {
  await db.query(
    `INSERT INTO subscriptions (user_id, provider, status, started_at, expires_at)
     VALUES ($1,'RAZORPAY','ACTIVE',to_timestamp($2/1000),to_timestamp($3/1000))
     ON CONFLICT (user_id)
     DO UPDATE SET status='ACTIVE', started_at=to_timestamp($2/1000), expires_at=to_timestamp($3/1000)`,
    [userId, start, end]
  );
};

exports.cancel = async (userId) => {
  await db.query(
    `UPDATE subscriptions SET status='CANCELLED' WHERE user_id=$1`,
    [userId]
  );
};

exports.findActiveByUser = async (userId) => {
  const res = await db.query(
    `SELECT * FROM subscriptions
     WHERE user_id=$1 AND status='ACTIVE' AND expires_at > now()`,
    [userId]
  );
  return res.rows[0];
};
