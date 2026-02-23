const router     = require('express').Router();
const controller = require('../controllers/payout.controller');
const auth       = require('../middlewares/auth.middleware');
const artist     = require('../middlewares/artist.middleware');

// All routes require authentication

// GET  /api/payouts/earnings         — wallet + monthly breakdown + request history
router.get('/earnings', auth, artist, controller.getEarnings);

// GET  /api/payouts/bank-details     — get saved bank / UPI info
router.get('/bank-details', auth, artist, controller.getBankDetails);

// POST /api/payouts/bank-details     — save / update bank / UPI info
router.post('/bank-details', auth, artist, controller.saveBankDetails);

// POST /api/payouts/withdraw         — create a withdrawal request
router.post('/withdraw', auth, artist, controller.requestWithdrawal);

// GET  /api/payouts/requests         — artist's own payout request history
router.get('/requests', auth, artist, controller.getMyPayoutRequests);

module.exports = router;
