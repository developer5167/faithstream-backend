const authService = require('../services/auth.service');
const { validateRegister, validateLogin } = require('../validators/auth.validator');

exports.register = async (req, res) => {
  try {
    validateRegister(req.body);
    const user = await authService.register(req.body);
    res.json(user);
  } catch (err) {
    if (err.code === '23505' || err.message.includes('users_email_key')) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    validateLogin(req.body);
    const tokens = await authService.login(req.body);
    res.json(tokens);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    const tokens = await authService.refresh(refreshToken);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const userInfo = await authService.me(req.user.id);
    res.json(userInfo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await authService.logout(req.user.id, req.headers.authorization.split(' ')[1]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
