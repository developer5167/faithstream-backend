const router = require('express').Router();
const controller = require('../controllers/app/bootstrap.controller');
const optionalAuth = require('../middlewares/optionalAuth.middleware');

// Public or Authed bootstrap app endpoint
router.get('/bootstrap', optionalAuth, controller.bootstrap);

module.exports = router;
