const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/register-token', auth, ctrl.registerToken);
router.post('/test', auth, ctrl.sendTestNotification);

module.exports = router;
