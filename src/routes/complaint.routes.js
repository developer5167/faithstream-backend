const router = require('express').Router();
const controller = require('../controllers/complaint.controller');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

// user reports a song
router.post('/', auth, controller.createComplaint);

// user views their own complaints
router.get('/my', auth, controller.getMyComplaints);

// admin views complaints
router.get('/admin', auth, admin, controller.getComplaints);

// admin searches songs to find reported content
router.get('/admin/search-songs', auth, admin, controller.searchSongs);

// admin links a song to a complaint
router.post('/admin/link-content', auth, admin, controller.linkContent);

// admin resolves complaint
router.post('/admin/resolve', auth, admin, controller.resolveComplaint);

module.exports = router;
