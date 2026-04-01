const router = require('express').Router();
const controller = require('../controllers/upload.controller');
const auth = require('../middlewares/auth.middleware');
const advertiserAuth = require('../middlewares/advertiser_auth.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter');
const jwtUtil = require('../utils/jwt.util');

// Generate presigned URL for file upload (protected route)
// We verify the JWT signature first, THEN decide which auth middleware to run
// based on the `type` claim in the verified payload.
// Previously this was done by decoding Base64 WITHOUT verifying the signature — 
// which allowed an attacker to forge `"type":"advertiser"` in the JWT payload.
router.post('/presigned-url', uploadLimiter, async (req, res, next) => {
    // 🛡️ SECURITY: Find the token in either the header (Mobile App) or HttpOnly cookies (Web Portals)
    const authHeader = req.headers.authorization;
    let token = authHeader?.split(' ')[1];

    if (!token) {
        // Fallback to cookies for Advertiser/Admin portals
        token = req.cookies?.advertiser_token || req.cookies?.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        // ✅ SECURE: Verify cryptographic signature FIRST — forged payloads will throw here
        const verified = jwtUtil.verify(token);

        // Now it's safe to trust the `type` claim
        if (verified.type === 'advertiser') {
            return advertiserAuth(req, res, next);
        } else {
            return auth(req, res, next);
        }
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}, controller.getPresignedUrl);

module.exports = router;

