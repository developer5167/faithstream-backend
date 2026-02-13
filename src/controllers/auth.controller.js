const authService = require('../services/auth.service');

exports.register = async (req, res) => {
  const user = await authService.register(req.body);
  res.json(user);
};

exports.login = async (req, res) => {
  console.log(req.body);
  const token = await authService.login(req.body);
  res.json(token);
};

exports.me = async (req, res) => {
  const userInfo = await authService.me(req.user.id);
  res.json(userInfo);
};

exports.logout = async (req, res) => {
  await authService.logout(req.user.id, req.headers.authorization.split(' ')[1]);
  res.json({ message: 'Logged out successfully' });
};
