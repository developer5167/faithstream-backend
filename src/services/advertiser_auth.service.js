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
