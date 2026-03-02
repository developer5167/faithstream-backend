const payoutService  = require('../services/payout.service');
const adminRepo      = require('../repositories/adminAction.repo');
const artistRepo     = require('../repositories/artist.repo');
const userRepo       = require('../repositories/user.repo');
const payoutCtrl     = require('./payout.controller');
const artistService  = require('../services/artist.service');

exports.dashboard = async (req, res) => {
  res.json(await adminRepo.getStats());
};

exports.auditLogs = async (req, res) => {
  res.json(await adminRepo.getAuditLogs());
};

exports.getArtistList = async (req, res) => {
  const result = await userRepo.getVerifiedArtists();
  res.json(result);
};

// ─── Payout Management (delegated to payout controller) ──────────────────────

// GET  /api/admin/payouts               — all earnings records
exports.getPayouts                = payoutCtrl.getAllEarnings;

// POST /api/admin/payouts/mark-paid     — manually mark an earning as paid
exports.markPaid                  = payoutCtrl.markEarningPaid;

// POST /api/admin/payouts/trigger       — trigger monthly calculation
exports.triggerMonthlyPayout      = payoutCtrl.triggerMonthlyPayout;

// GET  /api/admin/payouts/requests      — all withdrawal requests (filterable)
exports.getAllPayoutRequests       = payoutCtrl.getAllPayoutRequests;

// POST /api/admin/payouts/requests/:id/approve — approve & send Razorpay X payout
exports.approvePayoutRequest      = payoutCtrl.approvePayoutRequest;

// GET  /api/admin/payouts/dashboard     — payout summary stats
exports.getPayoutDashboard        = payoutCtrl.getAdminDashboard;

// POST /api/admin/artists/create — admin creates a trusted artist account directly
exports.createArtistAccount = async (req, res) => {
  try {
    const { name, email, password, artist_name, bio } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const result = await artistService.createArtistAccount(req.user.id, {
      name,
      email,
      password,
      artist_name,
      bio,
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

