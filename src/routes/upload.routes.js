const router = require('express').Router();
const controller = require('../controllers/upload.controller');
const auth = require('../middlewares/auth.middleware');

// Generate presigned URL for file upload (protected route)
router.post('/presigned-url', auth, controller.getPresignedUrl);

module.exports = router;
