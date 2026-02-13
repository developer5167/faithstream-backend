const router = require('express').Router();
const controller = require('../controllers/stream.controller');
const auth = require('../middlewares/auth.middleware');
const subscription = require('../middlewares/subscription.middleware');

router.get('/:songId/url', auth, subscription, controller.getStreamUrl);
router.post('/log', auth, controller.logStream);

module.exports = router;
