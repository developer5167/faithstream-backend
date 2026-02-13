const router = require('express').Router();
const controller = require('../controllers/supportTicket.controller');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

// User endpoints
router.post('/', auth, controller.createTicket);
router.get('/my', auth, controller.getMyTickets);

// Admin endpoints
router.get('/admin', auth, admin, controller.getOpenTickets);
router.post('/admin/reply', auth, admin, controller.replyToTicket);

module.exports = router;
