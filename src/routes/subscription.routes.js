const router  = require('express').Router();
const ctrl    = require('../controllers/subscription.controller');
const auth    = require('../middlewares/auth.middleware');
const admin   = require('../middlewares/admin.middleware');

// ── User routes ───────────────────────────────────────────────────────────────
// Create Razorpay order for razorpay_flutter plugin
router.post('/create-order',      auth, ctrl.createOrder);

// Verify and activate after successful payment
router.post('/verify-payment',    auth, ctrl.verifyPayment);

// Create a Razorpay Payment Link (legacy)
router.post('/create-link',       auth, ctrl.createPaymentLink);

// Get current user's subscription status
router.get('/status',             auth, ctrl.getStatus);

// Legacy create (backward compat → now calls createPaymentLink)
router.post('/create',            auth, ctrl.createPaymentLink);

// ── Payment link callback routes (browser redirect after payment) ─────────────
// These are purely informational pages — actual activation is via webhook.
router.get('/payment/success', (req, res) => {
  res.setHeader('ngrok-skip-browser-warning', '1');
  res.send(`<!DOCTYPE html>
<html>
  <head><title>Payment Successful</title>
  <meta http-equiv="refresh" content="3; url=faithstream://subscription">
  <style>body{font-family:sans-serif;text-align:center;padding:60px;background:#0d0d0d;color:#fff;}
  h1{color:#6A0DAD;}p{color:#aaa;}</style></head>
  <body><h1>✅ Payment Successful!</h1>
  <p>Your FaithStream Premium subscription is being activated.</p>
  <p>Return to the app — your status will update automatically.</p>
  </body>
</html>`);
});

router.get('/payment/cancel', (req, res) => {
  res.setHeader('ngrok-skip-browser-warning', '1');
  res.send(`<!DOCTYPE html>
<html>
  <head><title>Payment Cancelled</title>
  <style>body{font-family:sans-serif;text-align:center;padding:60px;background:#0d0d0d;color:#fff;}
  h1{color:#e53e3e;}p{color:#aaa;}</style></head>
  <body><h1>❌ Payment Cancelled</h1>
  <p>No charge was made. Return to the FaithStream app to try again.</p>
  </body>
</html>`);
});

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin',         auth, admin, ctrl.adminList);
router.get('/admin/stats',   auth, admin, ctrl.adminStats);
router.post('/admin/grant',  auth, admin, ctrl.adminGrant);

module.exports = router;
