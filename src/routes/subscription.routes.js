const router = require('express').Router();
const controller = require('../controllers/subscription.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/create', auth, controller.createSubscription);
router.get('/status', auth, controller.getStatus);

module.exports = router;
