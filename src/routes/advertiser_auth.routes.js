const router = require('express').Router();
const controller = require('../controllers/advertiser_auth.controller');
const advertiserAuthMiddleware = require('../middlewares/advertiser_auth.middleware');

router.post('/initiate-signup', controller.initiateSignup);
router.post('/verify-otp', controller.verifyOTP);
router.post('/signup', controller.register);
router.post('/login', controller.login);
router.get('/me', advertiserAuthMiddleware, controller.me);
router.post('/logout', advertiserAuthMiddleware, controller.logout);

module.exports = router;
