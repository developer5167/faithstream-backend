const jwtUtil = require('../utils/jwt.util');
const db = require('../config/db');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    const decoded = jwtUtil.verify(token);

    // Verify token still exists in DB (supports logout / revocation)
    const tokenRes = await db.query(
      `SELECT 1 FROM user_tokens WHERE user_id = $1 AND token = $2`,
      [decoded.id, token]
    );
    if (tokenRes.rowCount === 0) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Verify user is not blocked
    const userRes = await db.query(
      `SELECT is_blocked FROM users WHERE id = $1`,
      [decoded.id]
    );
    if (!userRes.rows[0] || userRes.rows[0].is_blocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
