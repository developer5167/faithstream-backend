const advertiserAuthService = require('../services/advertiser_auth.service');

exports.initiateSignup = async (req, res) => {
  try {
    const result = await advertiserAuthService.initiateSignup(req.body.email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await advertiserAuthService.verifyEmail(email, otp);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const result = await advertiserAuthService.register(req.body);
    // ✅ Set HttpOnly cookie on successful registration too
    res.cookie('advertiser_token', result.token, {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ advertiser: result.advertiser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await advertiserAuthService.login(req.body);
    // ✅ Set as HttpOnly cookie — JS on the page CANNOT read this token
    res.cookie('advertiser_token', result.token, {
      httpOnly: true,          // Block JS access entirely
      sameSite: 'none',      // Must be none for cross-subdomain API usage
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // Send advertiser data only — no token in JSON body
    res.json({ advertiser: result.advertiser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await advertiserAuthService.me(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.sendPasswordResetOtp = async (req, res) => {
  try {
    const result = await advertiserAuthService.sendPasswordResetOtp(req.body.email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await advertiserAuthService.verifyPasswordResetOtp(email, otp);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password } = req.body;
    const result = await advertiserAuthService.resetPassword(reset_token, new_password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // Read token from cookie (HttpOnly) instead of Authorization header
    const token = req.cookies?.advertiser_token;
    if (token && req.user) {
      await advertiserAuthService.logout(req.user.id, token);
    }
    // ✅ Clear the cookie — browser discards it immediately
    res.clearCookie('advertiser_token', { httpOnly: true, sameSite: 'none', secure: process.env.NODE_ENV === 'production' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
