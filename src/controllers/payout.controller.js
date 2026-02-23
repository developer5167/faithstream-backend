const payoutService = require('../services/payout.service');

// ─── Artist-Facing ────────────────────────────────────────────────────────────

exports.getEarnings = async (req, res) => {
  try {
    const data = await payoutService.getArtistEarnings(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.saveBankDetails = async (req, res) => {
  try {
    const details = await payoutService.saveBankDetails(req.user.id, req.body);
    res.json({ message: 'Bank details saved successfully', details });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getBankDetails = async (req, res) => {
  try {
    const details = await payoutService.getBankDetails(req.user.id);
    res.json(details || {});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid withdrawal amount is required' });
    }
    const request = await payoutService.requestWithdrawal(req.user.id, parseFloat(amount));
    res.status(201).json({ message: 'Withdrawal request submitted', request });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMyPayoutRequests = async (req, res) => {
  try {
    const requests = await payoutService.getAllPayoutRequests();
    // filter only this artist's requests
    const filtered = requests.filter(r => r.artist_user_id === req.user.id);
    res.json(filtered);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ─── Admin-Facing ─────────────────────────────────────────────────────────────

exports.getAdminDashboard = async (req, res) => {
  try {
    const data = await payoutService.getAdminPayoutDashboard();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.triggerMonthlyPayout = async (req, res) => {
  try {
    const { month } = req.body; // e.g. "2026-02"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month must be in YYYY-MM format' });
    }
    const result = await payoutService.calculateMonthlyPayouts(month);
    res.json({ message: 'Monthly payout calculation complete', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllPayoutRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await payoutService.getAllPayoutRequests(status);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approvePayoutRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await payoutService.approvePayoutRequest(parseInt(id), req.user.id);
    res.json({ message: 'Payout processed successfully', result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllEarnings = async (req, res) => {
  try {
    const earnings = await payoutService.getAll();
    res.json(earnings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markEarningPaid = async (req, res) => {
  try {
    await payoutService.markPaid(req.body.payout_id);
    res.json({ message: 'Payout marked as paid' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
