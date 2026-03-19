const advertiserRepo = require('../repositories/advertiser.repo');
const bcrypt = require('../utils/password.util');
const jwt = require('../utils/jwt.util');
const otpService = require('./otp.service');

exports.initiateSignup = async (email) => {
  const existing = await advertiserRepo.findByEmail(email);
  if (existing) throw new Error('Email already registered');

  await otpService.generateAndSendOTP(email);
  return { message: 'OTP sent successfully' };
};

exports.verifyEmail = async (email, otp) => {
  await otpService.verifyOTP(email, otp);
  return { message: 'Email verified successfully' };
};

exports.register = async ({ companyName, email, password, phone }) => {
  const existing = await advertiserRepo.findByEmail(email);
  if (existing) throw new Error('Email already registered');

  // Verify that the email was actually validated via OTP
  const isVerified = await otpService.isEmailVerified(email);
  if (!isVerified) {
    throw new Error('Email has not been verified via OTP. Please complete OTP verification first.');
  }
  
  const hash = await bcrypt.hash(password);
  const advertiser = await advertiserRepo.createAdvertiser(companyName, email, hash, phone);
  
  // Clear the OTP record so it can't be reused
  await otpService.clearOTP(email);

  const token = jwt.sign({ id: advertiser.id, type: 'advertiser' });
  await advertiserRepo.saveToken(advertiser.id, token);

  return {
    token,
    advertiser: {
      id: advertiser.id,
      company_name: advertiser.company_name,
      email: advertiser.email,
      phone: advertiser.phone,
      status: advertiser.status,
      created_at: advertiser.created_at,
    },
  };
};

exports.login = async ({ email, password }) => {
  const advertiser = await advertiserRepo.findByEmail(email);
  if (!advertiser) throw new Error('Invalid credentials');

  const ok = await bcrypt.compare(password, advertiser.password_hash);
  if (!ok) throw new Error('Invalid credentials');

  if (advertiser.status !== 'ACTIVE') throw new Error('Account is suspended');

  const token = jwt.sign({ id: advertiser.id, type: 'advertiser' });
  await advertiserRepo.saveToken(advertiser.id, token);

  return {
    token,
    advertiser: {
      id: advertiser.id,
      company_name: advertiser.company_name,
      email: advertiser.email,
      phone: advertiser.phone,
      status: advertiser.status,
      created_at: advertiser.created_at,
    },
  };
};

exports.me = async (advertiserId) => {
  const advertiser = await advertiserRepo.findById(advertiserId);
  if (!advertiser) throw new Error('Advertiser not found');

  return {
    id: advertiser.id,
    company_name: advertiser.company_name,
    email: advertiser.email,
    phone: advertiser.phone,
    status: advertiser.status,
    created_at: advertiser.created_at,
    role: 'advertiser'
  };
};

exports.logout = async (advertiserId, token) => {
  await advertiserRepo.removeToken(advertiserId, token);
};

// ==========================================
// Forgot Password Flow
// ==========================================

exports.sendPasswordResetOtp = async (email) => {
  const existing = await advertiserRepo.findByEmail(email);
  if (!existing) {
    throw new Error('No advertiser account found with this email.');
  }

  // Use the generic Redis-backed OTP system
  await otpService.generateAndSendGenericOTP(
    email,
    'advertiser_reset_password',
    'Reset Your Advertiser Password',
    'You requested a password reset for your FaithStream Advertiser account.'
  );

  return { message: 'OTP sent successfully' };
};

exports.verifyPasswordResetOtp = async (email, otp) => {
  await otpService.verifyGenericOTP(email, otp, 'advertiser_reset_password');
  
  // Issue a 15-minute specialized token for the reset operation
  const resetToken = jwt.signPurposeToken(
    { email, type: 'advertiser' },
    'advertiser_reset'
  );

  return { reset_token: resetToken };
};

exports.resetPassword = async (resetToken, newPassword) => {
  // 1. Verify the specific purpose token
  const payload = jwt.verifyPurposeToken(resetToken, 'advertiser_reset');
  if (!payload || !payload.email || payload.type !== 'advertiser') {
    throw new Error('Invalid or expired reset token. Please request a new OTP.');
  }

  // 2. Locate the user
  const advertiser = await advertiserRepo.findByEmail(payload.email);
  if (!advertiser) {
    throw new Error('Advertiser not found.');
  }

  // 3. Hash the new password and update the DB
  const hash = await bcrypt.hash(newPassword);
  await advertiserRepo.updatePassword(advertiser.id, hash);

  // Clean up any remaining OTP keys for this email (defensive cleanup)
  const redisClient = require('../config/redis');
  await redisClient.del(`otp:advertiser_reset_password:${payload.email}`);
  await redisClient.del(`otp_attempts:advertiser_reset_password:${payload.email}`);

  // 4. Invalidate all existing sessions (security best practice)
  await advertiserRepo.removeAllTokens(advertiser.id);

  return { message: 'Password updated successfully. All previous sessions have been logged out.' };
};
