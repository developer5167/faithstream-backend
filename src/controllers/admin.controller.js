const payoutService = require('../services/payout.service');
const adminRepo = require('../repositories/adminAction.repo');
const artistRepo = require('../repositories/artist.repo');
const userRepo = require('../repositories/user.repo');

exports.dashboard = async (req, res) => {
  res.json(await adminRepo.getStats());
};

exports.auditLogs = async (req, res) => {
  res.json(await adminRepo.getAuditLogs());
};

exports.getPayouts = async (req, res) => {
  res.json(await payoutService.getAll());
};

exports.markPaid = async (req, res) => {
  await payoutService.markPaid(req.body.payout_id);
  res.json({ message: 'Payout marked as paid' });
};

exports.getArtistList = async (req, res) => {
  const result = await userRepo.getVerifiedArtists();
  res.json(result);
};
