const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });
  }

  async createDepositOrder(advertiserId, amountInr) {
    const amountPaise = Math.round(amountInr * 100);
    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${advertiserId.substring(0, 8)}_${Date.now()}`,
    };

    const order = await this.razorpay.orders.create(options);
    return order;
  }

  async verifyAndRecordDeposit(advertiserId, amountInr, paymentId, orderId, signature) {
    // 1. Verify Signature
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new Error("Invalid payment signature");
    }

    // 2. Record Transaction & Update Wallet in a single DB Transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Add to wallet history
      await client.query(
        `INSERT INTO wallet_transactions (advertiser_id, amount, type, reference_id)
         VALUES ($1, $2, 'DEPOSIT', $3)`,
        [advertiserId, amountInr, paymentId]
      );

      // Add to balance
      const res = await client.query(
        `UPDATE advertisers 
         SET wallet_balance = wallet_balance + $2 
         WHERE id = $1 
         RETURNING wallet_balance`,
        [advertiserId, amountInr]
      );

      await client.query('COMMIT');
      return res.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PaymentService();
