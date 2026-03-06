const authService = require('../services/auth.service');
const { validateRegister, validateLogin } = require('../validators/auth.validator');

exports.register = async (req, res) => {
  try {
    validateRegister(req.body);
    const user = await authService.register(req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    validateLogin(req.body);
    const token = await authService.login(req.body);
    res.json(token);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
