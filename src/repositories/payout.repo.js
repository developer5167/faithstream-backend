const db = require('../config/db');

// ─── Earnings (existing, extended) ───────────────────────────────────────────

exports.create = async ({ artist_user_id, month, total_streams, amount }) => {
  await db.query(
    `INSERT INTO artist_earnings
       (artist_user_id, month, total_streams, amount)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (artist_user_id, month)
     DO UPDATE SET total_streams = $3, amount = $4`,
    [artist_user_id, month, total_streams, amount]
  );
};

exports.getAll = async () => {
  const res = await db.query(
    `SELECT
        ae.*,
        ap.artist_name,
        u.email,
        abd.payment_type,
        abd.upi_id,
        abd.account_number,
        abd.ifsc_code,
        abd.account_name
     FROM artist_earnings ae
     LEFT JOIN artist_profiles ap ON ae.artist_user_id = ap.user_id
     LEFT JOIN users u ON u.id = ae.artist_user_id
     LEFT JOIN artist_bank_details abd ON abd.artist_user_id = ae.artist_user_id
     ORDER BY ae.created_at DESC`
  );
  return res.rows;
};

exports.getByArtist = async (artistUserId) => {
  const res = await db.query(
    `SELECT *
     FROM artist_earnings
     WHERE artist_user_id = $1
     ORDER BY month DESC`,
    [artistUserId]
  );
  return res.rows;
};

exports.markPaid = async (id, razorpayPayoutId = null) => {
  await db.query(
    `UPDATE artist_earnings
     SET status = 'PAID', paid_at = NOW(), razorpay_payout_id = $2
     WHERE id = $1`,
    [id, razorpayPayoutId]
  );
};

// ─── Artist Wallets ───────────────────────────────────────────────────────────

exports.getWallet = async (artistUserId) => {
  const res = await db.query(
    `SELECT * FROM artist_wallets WHERE artist_user_id = $1`,
    [artistUserId]
  );
  return res.rows[0] || null;
};

exports.upsertWallet = async (artistUserId) => {
  await db.query(
    `INSERT INTO artist_wallets (artist_user_id)
     VALUES ($1)
     ON CONFLICT (artist_user_id) DO NOTHING`,
    [artistUserId]
  );
};

exports.creditWallet = async (artistUserId, amount) => {
  await db.query(
    `INSERT INTO artist_wallets (artist_user_id, balance, total_earned, updated_at)
     VALUES ($1, $2, $2, NOW())
     ON CONFLICT (artist_user_id)
     DO UPDATE SET
       balance      = artist_wallets.balance + $2,
       total_earned = artist_wallets.total_earned + $2,
       updated_at   = NOW()`,
    [artistUserId, amount]
  );
};

exports.debitWallet = async (artistUserId, amount) => {
  const res = await db.query(
    `UPDATE artist_wallets
     SET
       balance      = balance - $2,
       total_paid_out = total_paid_out + $2,
       updated_at   = NOW()
     WHERE artist_user_id = $1 AND balance >= $2
     RETURNING balance`,
    [artistUserId, amount]
  );
  if (res.rowCount === 0) throw new Error('Insufficient wallet balance');
  return res.rows[0];
};

exports.getAllWallets = async () => {
  const res = await db.query(
    `SELECT
       aw.*,
       ap.artist_name,
       u.email,
       abd.payment_type,
       abd.upi_id,
       abd.account_number,
       abd.ifsc_code,
       abd.account_name
     FROM artist_wallets aw
     LEFT JOIN artist_profiles ap ON aw.artist_user_id = ap.user_id
     LEFT JOIN users u ON u.id = aw.artist_user_id
     LEFT JOIN artist_bank_details abd ON abd.artist_user_id = aw.artist_user_id
     ORDER BY aw.balance DESC`
  );
  return res.rows;
};

// ─── Bank Details ─────────────────────────────────────────────────────────────

exports.saveBankDetails = async (artistUserId, data) => {
  const { payment_type, upi_id, account_number, ifsc_code, account_name, pan_number } = data;
  const res = await db.query(
    `INSERT INTO artist_bank_details
       (artist_user_id, payment_type, upi_id, account_number, ifsc_code, account_name, pan_number, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (artist_user_id)
     DO UPDATE SET
       payment_type   = $2,
       upi_id         = $3,
       account_number = $4,
       ifsc_code      = $5,
       account_name   = $6,
       pan_number     = $7,
       is_verified    = FALSE,
       updated_at     = NOW()
     RETURNING *`,
    [artistUserId, payment_type, upi_id, account_number, ifsc_code, account_name, pan_number]
  );
  return res.rows[0];
};

exports.getBankDetails = async (artistUserId) => {
  const res = await db.query(
    `SELECT * FROM artist_bank_details WHERE artist_user_id = $1`,
    [artistUserId]
  );
  return res.rows[0] || null;
};

// ─── Payout Requests ──────────────────────────────────────────────────────────

exports.createPayoutRequest = async (artistUserId, amount) => {
  const res = await db.query(
    `INSERT INTO artist_payout_requests (artist_user_id, amount)
     VALUES ($1, $2)
     RETURNING *`,
    [artistUserId, amount]
  );
  return res.rows[0];
};

exports.getPayoutRequests = async (filters = {}) => {
  let where = '1=1';
  const params = [];
  let i = 1;

  if (filters.artistUserId) {
    where += ` AND apr.artist_user_id = $${i++}`;
    params.push(filters.artistUserId);
  }

  if (filters.status) {
    where += ` AND apr.status = $${i++}`;
    params.push(filters.status);
  }

  const res = await db.query(
    `SELECT
       apr.*,
       ap.artist_name,
       u.email,
       abd.payment_type,
       abd.upi_id,
       abd.account_number,
       abd.ifsc_code,
       abd.account_name
     FROM artist_payout_requests apr
     LEFT JOIN artist_profiles ap ON apr.artist_user_id = ap.user_id
     LEFT JOIN users u ON u.id = apr.artist_user_id
     LEFT JOIN artist_bank_details abd ON abd.artist_user_id = apr.artist_user_id
     WHERE ${where}
     ORDER BY apr.requested_at DESC`,
    params
  );
  return res.rows;
};

exports.updatePayoutRequest = async (requestId, updates) => {
  const { status, razorpay_payout_id, failure_reason, approved_by } = updates;
  const res = await db.query(
    `UPDATE artist_payout_requests
     SET
       status             = COALESCE($2, status),
       razorpay_payout_id = COALESCE($3, razorpay_payout_id),
       failure_reason     = COALESCE($4, failure_reason),
       approved_by        = COALESCE($5, approved_by),
       processed_at       = CASE WHEN $2 IN ('COMPLETED', 'FAILED') THEN NOW() ELSE processed_at END
     WHERE id = $1
     RETURNING *`,
    [requestId, status, razorpay_payout_id, failure_reason, approved_by]
  );
  return res.rows[0];
};

exports.getPayoutRequestById = async (requestId) => {
  const res = await db.query(
    `SELECT
       apr.*,
       abd.payment_type,
       abd.upi_id,
       abd.account_number,
       abd.ifsc_code,
       abd.account_name,
       abd.pan_number
     FROM artist_payout_requests apr
     LEFT JOIN artist_bank_details abd ON abd.artist_user_id = apr.artist_user_id
     WHERE apr.id = $1`,
    [requestId]
  );
  return res.rows[0] || null;
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

exports.getPayoutStats = async () => {
  const res = await db.query(
    `SELECT
       (SELECT COALESCE(SUM(balance), 0)         FROM artist_wallets)        AS total_wallet_balance,
       (SELECT COALESCE(SUM(total_earned), 0)    FROM artist_wallets)        AS total_ever_earned,
       (SELECT COALESCE(SUM(total_paid_out), 0)  FROM artist_wallets)        AS total_ever_paid,
       (SELECT COUNT(*) FROM artist_payout_requests WHERE status = 'PENDING') AS pending_requests,
       (SELECT COALESCE(SUM(amount), 0) FROM artist_payout_requests WHERE status = 'PENDING') AS pending_amount
    `
  );
  return res.rows[0];
};
