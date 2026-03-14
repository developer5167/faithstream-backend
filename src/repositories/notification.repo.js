const db = require('../config/db');

exports.create = async (data) => {
  const { user_id, title, body, notification_data = {} } = data;
  const res = await db.query(
    `INSERT INTO notifications (user_id, title, body, data)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user_id, title, body, JSON.stringify(notification_data)]
  );
  return res.rows[0];
};

exports.findByUser = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const res = await db.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countRes = await db.query(
    `SELECT COUNT(*) as total FROM notifications WHERE user_id = $1`,
    [userId]
  );

  return {
    items: res.rows,
    total: parseInt(countRes.rows[0].total)
  };
};

exports.markAsRead = async (notificationId, userId) => {
  const res = await db.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return res.rows[0];
};

exports.markAllAsRead = async (userId) => {
  await db.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
};

exports.delete = async (notificationId, userId) => {
  await db.query(
    `DELETE FROM notifications
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
};
