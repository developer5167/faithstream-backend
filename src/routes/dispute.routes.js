const router = require('express').Router();
const controller = require('../controllers/dispute.controller');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

router.get('/admin', auth, admin, controller.getDisputes);
router.post('/admin/resolve', auth, admin, controller.resolveDispute);

module.exports = router;
