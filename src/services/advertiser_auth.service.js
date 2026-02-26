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

  // Note: OTP verification should happen before this call in the UI flow.
  // We can add a check here if we track verification status in DB.
  
  const hash = await bcrypt.hash(password);
  const advertiser = await advertiserRepo.createAdvertiser(companyName, email, hash, phone);
  
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
