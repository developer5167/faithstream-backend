const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('../config/env');

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

/**
 * Generate a short-lived token for a specific purpose (e.g., password reset, email verification)
 * @param {Object} payload - Data to embed in the token (like email or userId)
 * @param {String} purpose - The strict purpose of this token (e.g. 'verification', 'reset_password')
 * @param {String} expiresIn - Expiration time (default 15 minutes)
 */
exports.signPurposeToken = (payload, purpose, expiresIn = '15m') => {
  return jwt.sign(
    {
      ...payload,
      tokenType: 'purpose',
      purpose: purpose,
    },
    JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verify a short-lived purpose token
 * @param {String} token - The JWT token back from client
 * @param {String} purpose - The strict purpose of this token for validation
 */
exports.verifyPurposeToken = (token, purpose) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.tokenType !== 'purpose' || decoded.purpose !== purpose) {
    throw new Error('Invalid token purpose or type.');
  }
  return decoded;
};
