const jwtUtil = require('../utils/jwt.util');

/**
 * Optional authentication middleware
 * Attempts to authenticate the user, but continues even if authentication fails
 * Sets req.user if token is valid, otherwise req.user is undefined
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(' ')[1];
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
