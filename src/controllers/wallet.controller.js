const paymentService = require('../services/payment.service');
const db = require('../config/db');

exports.createOrder = async (req, res) => {
  try {
    const { amountInr } = req.body;
    if (!amountInr || amountInr <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const order = await paymentService.createDepositOrder(req.user.id, amountInr);
    res.json({ order });
  } catch (error) {
    console.error('Error creating deposit order:', error);
    res.status(500).json({ error: 'Failed to create deposit order' });
  }
};

exports.verifyDeposit = async (req, res) => {
  try {
    const { amountInr, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!amountInr || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    const result = await paymentService.verifyAndRecordDeposit(
      req.user.id,
      amountInr,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    );

    res.json({ success: true, newBalance: result.wallet_balance });
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(400).json({ error: 'Payment verification failed' });
  }
};

exports.getWalletDetails = async (req, res) => {
  try {
    const balanceRes = await db.query('SELECT wallet_balance FROM advertisers WHERE id = $1', [req.user.id]);
    const txRes = await db.query(
      `SELECT * FROM wallet_transactions WHERE advertiser_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );

    res.json({
      balance: balanceRes.rows[0].wallet_balance,
      transactions: txRes.rows
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Failed to fetch wallet details' });
  }
};
