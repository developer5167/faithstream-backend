const userRepo = require('../repositories/user.repo');
const subscriptionRepo = require('../repositories/subscription.repo');
const bcrypt = require('../utils/password.util');
const jwt = require('../utils/jwt.util');
const redisClient = require('../config/redis');

exports.register = async ({ name, email, password }) => {
  const hash = await bcrypt.hash(password);
  const user = await userRepo.createUser(name, email, hash);
  
  const token = jwt.sign(user);
  // (Phase 4): No longer securely saving standard JWTs to Postgres to save write-cycles

  return {
    token,
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

  const token = jwt.sign(user);
  // (Phase 4): No longer securely saving standard JWTs to Postgres to save write-cycles

  return {
    token,
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
  // (Phase 4): Instead of deleting the token from Postgres, we add its signature
  // to the Redis blocklist so the fast `auth.middleware.js` will reject it.
  // We set the TTL to exactly 7 days (604,800s) to match the JWT expiration time.
  // After 7 days, Redis automatically shreds the key, making our blocklist self-cleaning!
  await redisClient.set(`bl_token:${token}`, '1', {
    EX: 604800
  });
};
