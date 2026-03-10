const router = require('express').Router();
const controller = require('../controllers/upload.controller');
const auth = require('../middlewares/auth.middleware');
const advertiserAuth = require('../middlewares/advertiser_auth.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter');

// Generate presigned URL for file upload (protected route)
// Generate presigned URL for file upload
router.post('/presigned-url', uploadLimiter, async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

    // Extract the token and decode it manually without verifying yet, 
    // to check if it's an advertiser token or a regular listener token
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token missing' });

    try {
        const decodedStr = Buffer.from(token.split('.')[1], 'base64').toString();
        const decoded = JSON.parse(decodedStr);

        if (decoded.type === 'advertiser') {
            return advertiserAuth(req, res, next);
        } else {
            return auth(req, res, next);
        }
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token format' });
    }
}, controller.getPresignedUrl);

module.exports = router;
