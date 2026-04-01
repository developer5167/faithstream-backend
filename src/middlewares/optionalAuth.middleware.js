const jwtUtil = require('../utils/jwt.util');

/**
 * Optional authentication middleware
 * Attempts to authenticate the user, but continues even if authentication fails
 * Sets req.user if token is valid, otherwise req.user is undefined
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ✅ SUPPORT: Both Mobile (Authorization Header) and Web (HttpOnly 'token' cookie)
  const token = (req.headers.authorization?.split(' ')[1]) || req.cookies?.token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwtUtil.verify(token);
    req.user = decoded;
  } catch (err) {
    // Token invalid, but continue without auth
    req.user = null;
  }

  next();
};
