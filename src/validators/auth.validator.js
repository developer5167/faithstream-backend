const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.validateRegister = ({ name, email, password, verified_email_token }) => {
  if (!verified_email_token) {
    throw new Error('Email verification token is required. Please verify your email first.');
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Name is required');
  }
  if (name.length > 100) {
    throw new Error('Name must be 100 characters or less');
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new Error('A valid email address is required');
  }
  if (email.length > 254) {
    throw new Error('Email must be 254 characters or less');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (password.length > 128) {
    throw new Error('Password must be 128 characters or less');
  }
};

exports.validateLogin = ({ email, password }) => {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new Error('A valid email address is required');
  }
  if (!password || password.length === 0) {
    throw new Error('Password is required');
  }
};
