const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const albumController = require('../controllers/album.controller');
const artistController = require('../controllers/artist.controller');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

router.get('/dashboard/stats', auth, admin, controller.dashboard);
router.get('/audit-logs', auth, admin, controller.auditLogs);
router.get('/payouts', auth, admin, controller.getPayouts);
router.post('/payouts/mark-paid', auth, admin, controller.markPaid);
router.get('/artists', auth, admin, controller.getArtistList);

// Verified Artists Management
router.get('/verified-artists', auth, admin, artistController.getVerifiedArtists);
router.get('/verified-artists/:artistId', auth, admin, artistController.getVerifiedArtistById);

// Album management
router.post('/albums/submit-for-artist', auth, admin, albumController.submitAlbumOnBehalfOfArtist);

module.exports = router;
