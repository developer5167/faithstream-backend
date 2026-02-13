const payoutRepo = require('../repositories/payout.repo');

exports.getAll = async () => {
  return payoutRepo.getAll();
};

exports.markPaid = async (payoutId) => {
  await payoutRepo.markPaid(payoutId);
};
