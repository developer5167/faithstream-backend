const router = require('express').Router();
const controller = require('../controllers/ad.controller');
const auth = require('../middlewares/auth.middleware');
const advertiserAuth = require('../middlewares/advertiser_auth.middleware');
const admin = require('../middlewares/admin.middleware');

// Public or User fetching ads
router.get('/next', controller.getNextAd);
// Allowing tracking with or without auth (if without auth, need to handle tracking without user_id)
// We'll enforce auth for now since the app requires login for most actions
router.post('/track', auth, controller.trackAdEvent);

// Advertiser Dashboard
// Advertiser Dashboard
router.post('/', advertiserAuth, controller.createAd);
router.get('/my', advertiserAuth, controller.getMyAds);
router.get('/my/dashboard', advertiserAuth, controller.getDashboardStats);
router.get('/my/:id', advertiserAuth, controller.getAdDetails);
router.patch('/my/:id/pause', advertiserAuth, controller.pauseAd);
router.patch('/my/:id/resume', advertiserAuth, controller.resumeAd);
router.delete('/my/:id', advertiserAuth, controller.deleteAd);

// Admin Actions
router.get('/admin/pending', auth, admin, controller.getPendingAds);
router.patch('/admin/:id/review', auth, admin, controller.reviewAd);

module.exports = router;
