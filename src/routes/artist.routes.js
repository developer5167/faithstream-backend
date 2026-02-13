const router = require('express').Router();
const artistController = require('../controllers/artist.controller');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

// user → request artist access
router.post('/request', auth, artistController.requestArtist);

// user → check artist status
router.get('/status', auth, artistController.getArtistStatus);

// admin → view artist requests
router.get('/admin/requests', auth, admin, artistController.getArtistRequests);

// admin → approve artist
router.post('/admin/approve', auth, admin, artistController.approveArtist);

// admin → reject artist
router.post('/admin/reject', auth, admin, artistController.rejectArtist);

// admin → get verified artists
router.get('/admin/verified', auth, admin, artistController.getVerifiedArtists);

// admin → get verified artist by id
router.get('/admin/verified/:artistId', auth, admin, artistController.getVerifiedArtistById);

// admin → get supporting links for an artist profile
router.get('/admin/supporting-links/:artistId', auth, admin, artistController.getSupportingLinks);

// admin → get supporting links by user id
router.get('/admin/supporting-links/user/:userId', auth, admin, artistController.getSupportingLinksByUserId);

module.exports = router;
