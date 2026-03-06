const db = require('../config/db');

module.exports = async (req, res, next) => {
  // Verify admin status from DB instead of trusting JWT payload
  const result = await db.query(
    `SELECT is_admin FROM users WHERE id = $1`,
    [req.user.id]
  );

  if (!result.rows[0] || !result.rows[0].is_admin) {
    return res.status(403).json({ error: 'Admin only' });
  }

  next();
};
