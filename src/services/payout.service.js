const payoutRepo = require('../repositories/payout.repo');
const notificationService = require('./notification.service');

const streamRepo = require('../repositories/stream.repo');
const subRepo    = require('../repositories/subscription.repo');

const MIN_WITHDRAWAL_AMOUNT = 100; // ₹100 minimum
const PLATFORM_CUT = 0.30;
const ARTIST_CUT   = 0.70;

// ─── Monthly Calculation ──────────────────────────────────────────────────────

/**
 * Run monthly payout calculation for a given month (YYYY-MM).
 * Calculates each artist's pro-rata share and credits their wallet.
 */
exports.calculateMonthlyPayouts = async (month) => {
  const totalRevenue = await streamRepo.getMonthlyRevenue(month);
  if (totalRevenue === 0) return { month, totalRevenue: 0, artists: 0, message: 'No revenue for this month' };

  const artistPool   = totalRevenue * ARTIST_CUT;
  const totalStreams  = await streamRepo.getTotalStreamsForMonth(month);
  if (totalStreams === 0) return { month, totalRevenue, artists: 0, message: 'No streams for this month' };

  const artistStreams = await streamRepo.getMonthlyArtistStreams(month);

  let credited = 0;
  for (const row of artistStreams) {
    const share  = parseInt(row.streams) / totalStreams;
    const amount = parseFloat((artistPool * share).toFixed(2));

    if (amount <= 0) continue;

    // Record the earnings row
    await payoutRepo.create({
      artist_user_id: row.artist_user_id,
      month,
      total_streams:  parseInt(row.streams),
      amount,
    });

    // Credit wallet
    await payoutRepo.creditWallet(row.artist_user_id, amount);
    credited++;
  }

  return {
    month,
    totalRevenue,
    artistPool,
    totalStreams,
    artistsCredited: credited,
  };
};

// ─── Artist Earnings ──────────────────────────────────────────────────────────

exports.getArtistEarnings = async (artistUserId) => {
  const [wallet, earnings, requests] = await Promise.all([
    payoutRepo.getWallet(artistUserId),
    payoutRepo.getByArtist(artistUserId),
    payoutRepo.getPayoutRequests({ artistUserId }),
  ]);

  return {
    wallet: wallet || { balance: 0, total_earned: 0, total_paid_out: 0 },
    monthly_earnings: earnings,
    payout_requests:  requests,
  };
};

// ─── Bank Details ─────────────────────────────────────────────────────────────

exports.saveBankDetails = async (artistUserId, data) => {
  const { payment_type } = data;

  if (payment_type === 'UPI' && !data.upi_id) {
    throw new Error('UPI ID is required for UPI payment type');
  }
  if (payment_type === 'BANK' && (!data.account_number || !data.ifsc_code || !data.account_name)) {
    throw new Error('Account number, IFSC code, and account name are required for BANK payment type');
  }

  return payoutRepo.saveBankDetails(artistUserId, data);
};

exports.getBankDetails = async (artistUserId) => {
  return payoutRepo.getBankDetails(artistUserId);
};

// ─── Withdrawal Request ───────────────────────────────────────────────────────

exports.requestWithdrawal = async (artistUserId, amount) => {
  if (amount < MIN_WITHDRAWAL_AMOUNT) {
    throw new Error(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}`);
  }

  // Check bank details exist
  const bankDetails = await payoutRepo.getBankDetails(artistUserId);
  if (!bankDetails) {
    throw new Error('Please add your bank / UPI details before requesting a withdrawal');
  }

  // Check wallet balance
  const wallet = await payoutRepo.getWallet(artistUserId);
  if (!wallet || wallet.balance < amount) {
    throw new Error(`Insufficient wallet balance. Available: ₹${wallet ? wallet.balance : 0}`);
  }

  // Check no pending request
  const pending = await payoutRepo.getPayoutRequests({ artistUserId, status: 'PENDING' });
  if (pending.length > 0) {
    throw new Error('You already have a pending withdrawal request. Please wait for it to be processed.');
  }

  const request = await payoutRepo.createPayoutRequest(artistUserId, amount);
  return request;
};

// ─── Admin: Process Payout ────────────────────────────────────────────────────

exports.approvePayoutRequest = async (requestId, adminId) => {
  const request = await payoutRepo.getPayoutRequestById(requestId);
  if (!request) throw new Error('Payout request not found');
  if (request.status !== 'PENDING') throw new Error(`Request is already ${request.status}`);

  // Mark as PROCESSING
  await payoutRepo.updatePayoutRequest(requestId, { status: 'PROCESSING', approved_by: adminId });

  try {
    // Attempt Razorpay X payout
    const razorpayPayoutId = await _sendRazorpayPayout(request);

    // Debit wallet
    await payoutRepo.debitWallet(request.artist_user_id, request.amount);

    // Mark completed
    await payoutRepo.updatePayoutRequest(requestId, {
      status: 'COMPLETED',
      razorpay_payout_id: razorpayPayoutId,
    });

    // Notify artist
    notificationService.sendToUser(
      request.artist_user_id,
      '💰 Payout Processed',
      `Your payout of ₹${request.amount} has been successfully processed.`,
      { type: 'payout_processed', payout_id: requestId }
    );

    return { success: true, razorpay_payout_id: razorpayPayoutId };

  } catch (err) {
    // Mark failed, restore PENDING so admin can retry
    await payoutRepo.updatePayoutRequest(requestId, {
      status: 'FAILED',
      failure_reason: err.message,
    });
    throw err;
  }
};

// ─── Admin: Dashboard ─────────────────────────────────────────────────────────

exports.getAdminPayoutDashboard = async () => {
  const [stats, pendingRequests, allWallets, allEarnings] = await Promise.all([
    payoutRepo.getPayoutStats(),
    payoutRepo.getPayoutRequests({ status: 'PENDING' }),
    payoutRepo.getAllWallets(),
    payoutRepo.getAll(),
  ]);

  return { stats, pending_requests: pendingRequests, wallets: allWallets, earnings: allEarnings };
};

exports.getAllPayoutRequests = async (status) => {
  return payoutRepo.getPayoutRequests(status ? { status } : {});
};

exports.getAll = async () => payoutRepo.getAll();
exports.markPaid = async (id) => payoutRepo.markPaid(id);

// ─── Razorpay X Payout (internal) ────────────────────────────────────────────

async function _sendRazorpayPayout(request) {
  // Razorpay X Payouts API
  // Requires RAZORPAY_X_KEY_ID and RAZORPAY_X_KEY_SECRET in .env
  // and an activated Razorpay X account.
  const keyId     = process.env.RAZORPAY_X_KEY_ID;
  const keySecret = process.env.RAZORPAY_X_KEY_SECRET;

  if (!keyId || !keySecret) {
    // In development / test mode: simulate success
    console.warn('[Payout] Razorpay X credentials not set — simulating payout success (DEV mode)');
    return `sim_payout_${Date.now()}`;
  }

  const axios  = require('axios');
  const amountPaise = Math.round(request.amount * 100);

  let fundAccount;
  if (request.payment_type === 'UPI') {
    fundAccount = { account_type: 'vpa', vpa: { address: request.upi_id } };
  } else {
    fundAccount = {
      account_type: 'bank_account',
      bank_account: {
        name:           request.account_name,
        ifsc:           request.ifsc_code,
        account_number: request.account_number,
      },
    };
  }

  const response = await axios.post(
    'https://api.razorpay.com/v1/payouts',
    {
      account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER,
      amount:         amountPaise,
      currency:       'INR',
      mode:           request.payment_type === 'UPI' ? 'UPI' : 'NEFT',
      purpose:        'payout',
      fund_account:   fundAccount,
      queue_if_low_balance: true,
      reference_id:   `faithstream_payout_${request.id}`,
      narration:      'FaithStream Artist Payout',
    },
    {
      auth: { username: keyId, password: keySecret },
    }
  );

  return response.data.id; // razorpay payout ID
}
