const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

/**
 * Generate JWT token for a user
 */
exports.sign = (user) => {
  return jwt.sign(
    {
      id: user.id,
      is_admin: user.is_admin || false,
      artist_status: user.artist_status,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

/**
 * Verify JWT token
 */
exports.verify = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
