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

exports.sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error('Email is required');
    await authService.sendRegistrationOtp(email);
    res.json({ message: 'Registration OTP sent successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new Error('Email and OTP are required');
    const token = await authService.verifyRegistrationOtp(email, otp);
    res.json({ verified_email_token: token, message: 'Email verified successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error('Email is required');
    await authService.sendPasswordResetOtp(email);
    res.json({ message: 'Password reset OTP sent successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new Error('Email and OTP are required');
    const token = await authService.verifyPasswordResetOtp(email, otp);
    res.json({ reset_token: token, message: 'OTP verified successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password } = req.body;
    if (!reset_token || !new_password) throw new Error('Reset token and new password are required');
    if (new_password.length < 8) throw new Error('Password must be at least 8 characters long');
    
    await authService.resetPassword(reset_token, new_password);
    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
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
