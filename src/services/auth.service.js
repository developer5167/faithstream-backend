const userRepo = require('../repositories/user.repo');
const subscriptionRepo = require('../repositories/subscription.repo');
const bcrypt = require('../utils/password.util');
const jwt = require('../utils/jwt.util');

exports.register = async ({ name, email, password }) => {
  const hash = await bcrypt.hash(password);
  const user = await userRepo.createUser(name, email, hash);
  
  const token = jwt.sign(user);
  await userRepo.saveToken(user.id, token);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      artist_status: user.artist_status || null,
      is_admin: user.is_admin || false,
      created_at: user.created_at || null,
    },
  };
};

exports.login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Invalid credentials');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('Invalid credentials');

  const token = jwt.sign(user);
  await userRepo.saveToken(user.id, token);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      artist_status: user.artist_status,
      is_admin: user.is_admin,
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
      created_at: user.created_at,
    },
    role,
    subscription_active: subscriptionActive,
  };
};

exports.logout = async (userId, token) => {
  await userRepo.removeToken(userId, token);
};
