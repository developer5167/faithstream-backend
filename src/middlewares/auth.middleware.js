const jwtUtil = require('../utils/jwt.util');
const redisClient = require('../config/redis');

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

    // Fast-Path Optimization (Phase 4): 
    // Instead of querying `user_tokens` in PostgreSQL on every single API request,
    // we assume the cryptographic JWT is valid unless it exists on the Redis Blocklist.
    // This reduces the latency of every API endpoint in the app by 50-100ms.
    const isBlacklisted = await redisClient.get(`bl_token:${token}`);
    
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
