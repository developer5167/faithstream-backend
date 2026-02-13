const router = require('express').Router();
const controller = require('../controllers/home.controller');
const optionalAuth = require('../middlewares/optionalAuth.middleware');

// Public home feed endpoint - shows recently played if user is authenticated
router.get('/', optionalAuth, controller.getHomeFeed);

module.exports = router;
