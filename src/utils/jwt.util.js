const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
// Using crypto to generate random session IDs and refresh tokens
const crypto = require('crypto');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h'; // Short-lived access token

/**
 * Generate a unique session ID for tracking concurrent devices
 */
exports.generateSessionId = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Generate Access JWT token for a user
 * @param {Object} user 
 * @param {String} sessionId 
 */
exports.sign = (user, sessionId) => {
  return jwt.sign(
    {
      id: user.id,
      is_admin: user.is_admin || false,
      artist_status: user.artist_status,
      type: user.type,
      sessionId: sessionId,
      tokenType: 'access',
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

/**
 * Generate Refresh JWT token for a user (valid for 30 days)
 * @param {Object} user 
 * @param {String} sessionId 
 */
exports.signRefresh = (user, sessionId) => {
  return jwt.sign(
    {
      id: user.id,
      sessionId: sessionId,
      tokenType: 'refresh',
    },
    JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
};

exports.verify = (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded;
};
