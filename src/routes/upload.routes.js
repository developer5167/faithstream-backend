const router = require('express').Router();
const controller = require('../controllers/upload.controller');
const auth = require('../middlewares/auth.middleware');
const advertiserAuth = require('../middlewares/advertiser_auth.middleware');

// Generate presigned URL for file upload (protected route)
router.post('/presigned-url', (req, res, next) => {
    // Check if either listener auth or advertiser auth is present
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });
    
    // We can try listener auth first, then advertiser auth
    // Or just check the header and let controller handle ID from req.user
    next();
}, (req, res, next) => {
    // This is a bit tricky with current middleware structure.
    // Let's just create a combined middleware or handle it inline.
    next();
}, (req, res, next) => {
    // Simpler: Allow any valid JWT and let controller use req.user.id
    // But advertiser_auth.middleware specifically checks for 'advertiser' type.
    // Let's just use a loose check here and verify in service if needed.
    return require('../middlewares/auth.middleware')(req, res, (err) => {
        if (!err) return next();
        return require('../middlewares/advertiser_auth.middleware')(req, res, next);
    });
}, controller.getPresignedUrl);

module.exports = router;
