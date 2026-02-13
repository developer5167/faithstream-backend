const db = require('../config/db');

/**
 * Create a new support ticket
 */
exports.create = async (userId, subject, message, category) => {
  const res = await db.query(
    `INSERT INTO support_tickets (user_id, subject, message, category)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, subject, message, category]
  );
  return res.rows[0];
};

/**
 * Get all tickets for a specific user
 */
exports.findByUser = async (userId) => {
  const res = await db.query(
    `SELECT id, subject, message, category, status, admin_reply, created_at, updated_at
     FROM support_tickets
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
};

/**
 * Get all open tickets (for admin)
 */
exports.findOpen = async () => {
  const res = await db.query(
    `SELECT t.*, u.name AS user_name, u.email AS user_email
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     WHERE t.status IN ('OPEN', 'IN_PROGRESS')
     ORDER BY t.created_at ASC`
  );
  return res.rows;
};

/**
 * Reply to a ticket and update its status
 */
exports.reply = async (ticketId, adminReply, status) => {
  await db.query(
    `UPDATE support_tickets 
     SET admin_reply = $2, status = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [ticketId, adminReply, status]
  );
};

/**
 * Get ticket by ID
 */
exports.findById = async (ticketId) => {
  const res = await db.query(
    `SELECT t.*, u.name AS user_name, u.email AS user_email
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [ticketId]
  );
  return res.rows[0];
};
