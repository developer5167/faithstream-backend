exports.validateRegister = ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password required');
  }
};
