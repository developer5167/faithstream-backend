const router = require('express').Router();
const controller = require('../controllers/stream.controller');
const auth = require('../middlewares/auth.middleware');
const subscription = require('../middlewares/subscription.middleware');

router.get('/:songId/url', auth, subscription, controller.getStreamUrl);
router.get('/:songId/hls.m3u8', controller.getHlsPlaylist);
router.get('/:songId/check-limit', auth, controller.checkPlayLimit);
router.post('/log', auth, controller.logStream);
router.post('/log-played', auth, controller.logRecentlyPlayed);

module.exports = router;
