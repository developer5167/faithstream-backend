const db = require('../config/db');

// ── Activate on payment ───────────────────────────────────────────────────────

exports.activateByPaymentId = async (userId, paymentId, amount) => {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
  await db.query(
    `INSERT INTO subscriptions
       (user_id, provider, plan, amount, status, razorpay_payment_id, started_at, expires_at)
     VALUES ($1, 'RAZORPAY', 'PREMIUM', $2, 'ACTIVE', $3, NOW(), $4)
     ON CONFLICT (user_id)
     DO UPDATE
       SET status              = 'ACTIVE',
           plan                = 'PREMIUM',
           amount              = $2,
           razorpay_payment_id = $3,
           started_at          = NOW(),
           expires_at          = $4`,
    [userId, amount, paymentId, expiresAt]
  );
};

// ── Legacy activate (keep for compatibility) ──────────────────────────────────

exports.activate = async (userId, start, end) => {
  await db.query(
    `INSERT INTO subscriptions (user_id, provider, plan, status, started_at, expires_at)
     VALUES ($1, 'RAZORPAY', 'PREMIUM', 'ACTIVE', to_timestamp($2/1000), to_timestamp($3/1000))
     ON CONFLICT (user_id)
     DO UPDATE SET status='ACTIVE', started_at=to_timestamp($2/1000), expires_at=to_timestamp($3/1000)`,
    [userId, start, end]
  );
};

// ── Query helpers ─────────────────────────────────────────────────────────────

exports.hasActiveSubscription = async (userId) => {
  const res = await db.query(
    `SELECT 1 FROM subscriptions
     WHERE user_id=$1 AND status='ACTIVE' AND expires_at > now()`,
    [userId]
  );
  return res.rowCount > 0;
};

exports.findActiveByUser = async (userId) => {
  const res = await db.query(
    `SELECT *,
       EXTRACT(EPOCH FROM (expires_at - NOW())) / 86400 AS days_remaining
     FROM subscriptions
     WHERE user_id=$1 AND status='ACTIVE' AND expires_at > now()`,
    [userId]
  );
  return res.rows[0] || null;
};

exports.cancel = async (userId) => {
  await db.query(
    `UPDATE subscriptions SET status='CANCELLED' WHERE user_id=$1`,
    [userId]
  );
};

// ── Expiry ────────────────────────────────────────────────────────────────────

exports.expireOverdue = async () => {
  const res = await db.query(
    `UPDATE subscriptions
     SET status = 'EXPIRED'
     WHERE status = 'ACTIVE' AND expires_at < NOW()
     RETURNING user_id`
  );
  return res.rows; // array of { user_id }
};

// ── Admin queries ─────────────────────────────────────────────────────────────

exports.findAllForAdmin = async ({ page = 1, limit = 20, status } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = status ? `WHERE s.status = '${status}'` : '';

  const countRes = await db.query(
    `SELECT COUNT(*) AS total FROM subscriptions s ${conditions}`
  );

  const res = await db.query(
    `SELECT s.*, u.name, u.email
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     ${conditions}
     ORDER BY s.started_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    data: res.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countRes.rows[0].total),
      totalPages: Math.ceil(countRes.rows[0].total / limit),
    },
  };
};

exports.getRevenueSummary = async (month) => {
  // month format: 'YYYY-MM' or null = current month
  const condition = month
    ? `AND to_char(started_at, 'YYYY-MM') = '${month}'`
    : `AND to_char(started_at, 'YYYY-MM') = to_char(NOW(), 'YYYY-MM')`;

  const res = await db.query(
    `SELECT
       COUNT(*)                              AS total_subscribers,
       COUNT(*) FILTER (WHERE status='ACTIVE') AS active_subscribers,
       COALESCE(SUM(amount), 0)             AS total_revenue
     FROM subscriptions
     WHERE status IN ('ACTIVE','EXPIRED') ${condition}`
  );
  return res.rows[0];
};

exports.grantPremium = async (userId, adminGranted = true) => {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.query(
    `INSERT INTO subscriptions
       (user_id, provider, plan, amount, status, razorpay_payment_id, started_at, expires_at)
     VALUES ($1, 'ADMIN', 'PREMIUM', 0, 'ACTIVE', 'admin-grant', NOW(), $2)
     ON CONFLICT (user_id)
     DO UPDATE
       SET status = 'ACTIVE', plan = 'PREMIUM', amount = 0,
           razorpay_payment_id = 'admin-grant',
           started_at = NOW(), expires_at = $2`,
    [userId, expiresAt]
  );
};

exports.revokePremium = async (userId) => {
  await db.query(
    `UPDATE subscriptions SET status='CANCELLED' WHERE user_id=$1`,
    [userId]
  );
};
