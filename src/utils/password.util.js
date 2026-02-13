const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

exports.hash = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

exports.compare = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
