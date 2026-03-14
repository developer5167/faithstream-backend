const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/register-token', auth, ctrl.registerToken);
router.post('/test', auth, ctrl.sendTestNotification);

router.get('/', auth, ctrl.getNotifications);
router.patch('/mark-all-read', auth, ctrl.markAllAsRead);
router.patch('/:id/read', auth, ctrl.markAsRead);

module.exports = router;
