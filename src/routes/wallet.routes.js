const router = require('express').Router();
const controller = require('../controllers/wallet.controller');
const advertiserAuthMiddleware = require('../middlewares/advertiser_auth.middleware');

router.use(advertiserAuthMiddleware);

router.get('/config', (req, res) => {
  res.json({ razorpayKeyId: process.env.RAZORPAY_KEY_ID });
});

router.get('/', controller.getWalletDetails);
router.post('/deposit/order', controller.createOrder);
router.post('/deposit/verify', controller.verifyDeposit);

module.exports = router;
