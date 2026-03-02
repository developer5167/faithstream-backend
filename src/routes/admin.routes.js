const router          = require('express').Router();
const controller      = require('../controllers/admin.controller');
const albumController = require('../controllers/album.controller');
const artistController = require('../controllers/artist.controller');
const auth  = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

// ─── Dashboard & Audit ────────────────────────────────────────────────────────
router.get('/dashboard/stats', auth, admin, controller.dashboard);
router.get('/audit-logs',      auth, admin, controller.auditLogs);
router.get('/artists',         auth, admin, controller.getArtistList);

// ─── Earnings (all time records) ──────────────────────────────────────────────
router.get('/payouts',           auth, admin, controller.getPayouts);
router.post('/payouts/mark-paid',auth, admin, controller.markPaid);

// ─── Monthly Calculation ──────────────────────────────────────────────────────
// POST body: { "month": "2026-02" }
router.post('/payouts/trigger',  auth, admin, controller.triggerMonthlyPayout);

// ─── Payout Dashboard Stats ───────────────────────────────────────────────────
router.get('/payouts/dashboard', auth, admin, controller.getPayoutDashboard);

// ─── Withdrawal Requests ──────────────────────────────────────────────────────
// GET  ?status=PENDING|PROCESSING|COMPLETED|FAILED
router.get('/payouts/requests',              auth, admin, controller.getAllPayoutRequests);
// POST /api/admin/payouts/requests/:id/approve
router.post('/payouts/requests/:id/approve', auth, admin, controller.approvePayoutRequest);

// ─── Verified Artists Management ─────────────────────────────────────────────
router.get('/verified-artists',      auth, admin, artistController.getVerifiedArtists);
router.get('/verified-artists/:artistId', auth, admin, artistController.getVerifiedArtistById);

// ─── Album Management ─────────────────────────────────────────────────────────
router.post('/albums/submit-for-artist', auth, admin, albumController.submitAlbumOnBehalfOfArtist);

// ─── Artist Account Creation by Admin (fast-track, bypasses verification) ────
router.post('/artists/create', auth, admin, controller.createArtistAccount);

module.exports = router;

