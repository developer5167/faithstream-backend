const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.get('/me', authMiddleware, controller.me);
router.post('/logout', authMiddleware, controller.logout);

// ─── Registration OTP Flow ───
router.post('/register/send-otp', controller.sendRegistrationOtp);
router.post('/register/verify-otp', controller.verifyRegistrationOtp);

// ─── Forgot Password OTP Flow ───
router.post('/forgot-password/send-otp', controller.sendPasswordResetOtp);
router.post('/forgot-password/verify-otp', controller.verifyPasswordResetOtp);
router.post('/forgot-password/reset', controller.resetPassword);

module.exports = router;
