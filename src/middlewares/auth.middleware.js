const jwtUtil = require('../utils/jwt.util');
const redisClient = require('../config/redis');

module.exports = async (req, res, next) => {
  // ✅ SUPPORT: Both Mobile (Authorization Header) and Web (HttpOnly 'token' cookie)
  const token = (req.headers.authorization?.split(' ')[1]) || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
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

    // Phase 7: Concurrent Device Limits
    // If the entire session was killed because the user gave their password to a 4th person,
    // intercept it and physically revoke all access.
    if (decoded.sessionId) {
      const isSessionRevoked = await redisClient.get(`bl_session:${decoded.sessionId}`);
      if (isSessionRevoked) {
        return res.status(401).json({ error: 'Session has been revoked due to device limits' });
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
