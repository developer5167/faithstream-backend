const userRepo = require('../repositories/user.repo');
const subscriptionRepo = require('../repositories/subscription.repo');
const bcrypt = require('../utils/password.util');
const jwt = require('../utils/jwt.util');
const redisClient = require('../config/redis');

exports.register = async ({ name, email, password }) => {
  const hash = await bcrypt.hash(password);
  const user = await userRepo.createUser(name, email, hash);
  
  const sessionId = jwt.generateSessionId();
  const token = jwt.sign(user, sessionId);
  const refreshToken = jwt.signRefresh(user, sessionId);
  
  await manageActiveSessions(user.id, sessionId);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      artist_status: user.artist_status || null,
      is_admin: user.is_admin || false,
      copyright_strikes: user.copyright_strikes || 0,
      created_at: user.created_at || null,
    },
  };
};

exports.login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  if (user.is_blocked) throw new Error('Account blocked due to severe policy violations.');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('Invalid credentials');

  const sessionId = jwt.generateSessionId();
  const token = jwt.sign(user, sessionId);
  const refreshToken = jwt.signRefresh(user, sessionId);
  
  await manageActiveSessions(user.id, sessionId);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      artist_status: user.artist_status,
      is_admin: user.is_admin,
      copyright_strikes: user.copyright_strikes || 0,
      created_at: user.created_at,
    },
  };
};

/**
 * Ensures a user never exceeds 3 concurrent active sessions
 */
async function manageActiveSessions(userId, newSessionId) {
  const sessionKey = `user_sessions:${userId}`;
  
  // Add new session to sorted set with timestamp as score
  await redisClient.zAdd(sessionKey, {
    score: Date.now(),
    value: newSessionId
  });

  const sessionCount = await redisClient.zCard(sessionKey);
  
  // If user has more than 3 active sessions, revoke the oldest one
  if (sessionCount > 3) {
    // Get the oldest session (index 0)
    const oldSessions = await redisClient.zRange(sessionKey, 0, 0);
    if (oldSessions.length > 0) {
      const oldestSession = oldSessions[0];
      await redisClient.zRem(sessionKey, oldestSession);
      // Revoke it globally across all Auth Middlewares (TTL 30 days)
      await redisClient.set(`bl_session:${oldestSession}`, '1', { EX: 2592000 });
    }
  }
}

exports.refresh = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken);
    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if entire session was revoked (e.g. exceeded device limits or logged out)
    const isRevoked = await redisClient.get(`bl_session:${decoded.sessionId}`);
    if (isRevoked) {
      throw new Error('Session has been revoked');
    }

    // Fetch user details for the new access token
    const user = await userRepo.findById(decoded.id);
    if (!user || user.is_blocked) {
      throw new Error('User inactive or blocked');
    }

    // Issue brand new short-lived access token, but KEEP the same sessionId!
    const newToken = jwt.sign(user, decoded.sessionId);
    
    // We optionally issue a new refresh token to implement Sliding Security Windows
    const newRefreshToken = jwt.signRefresh(user, decoded.sessionId);
    
    // Update score in Redis to keep this session alive
    const sessionKey = `user_sessions:${user.id}`;
    await redisClient.zAdd(sessionKey, {
      score: Date.now(),
      value: decoded.sessionId
    });

    return { token: newToken, refreshToken: newRefreshToken };
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }
};

exports.me = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new Error('User not found');

  const subscriptionActive = await subscriptionRepo.hasActiveSubscription(userId);

  // Determine role based on user attributes
  let role = 'user';
  if (user.is_admin) {
    role = 'admin';
  } else if (user.artist_status === 'APPROVED') {
    role = 'artist';
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      artist_status: user.artist_status,
      is_admin: user.is_admin,
      copyright_strikes: user.copyright_strikes || 0,
      created_at: user.created_at,
    },
    role,
    subscription_active: subscriptionActive,
  };
};

exports.logout = async (userId, token) => {
  try {
    const decoded = jwt.verify(token);
    
    // Add specific access token to blocklist (1 hour TTL)
    await redisClient.set(`bl_token:${token}`, '1', { EX: 3600 });
    
    if (decoded.sessionId) {
      // Add the entire session to blocklist to immediately kill the refresh token (30 day TTL)
      await redisClient.set(`bl_session:${decoded.sessionId}`, '1', { EX: 2592000 });
      // Remove it from their active sessions count
      await redisClient.zRem(`user_sessions:${userId}`, decoded.sessionId);
    }
  } catch (err) {
    // If token is already expired, we still try parsing to kill the session if possible
    const payload = jwt.decode(token);
    if (payload && payload.sessionId) {
       await redisClient.set(`bl_session:${payload.sessionId}`, '1', { EX: 2592000 });
       await redisClient.zRem(`user_sessions:${userId}`, payload.sessionId);
    }
  }
};
