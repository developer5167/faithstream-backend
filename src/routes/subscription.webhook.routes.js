const router = require('express').Router();
const controller = require('../controllers/subscription.controller');

// ❗ NO auth
// ❗ NO json parser
router.post('/', controller.webhook);

module.exports = router;
