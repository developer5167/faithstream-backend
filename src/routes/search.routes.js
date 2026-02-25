const router = require('express').Router();
const controller = require('../controllers/search.controller');
const optionalAuth = require('../middlewares/optionalAuth.middleware');

// Public search endpoint - finds songs, albums, and artists based on query
router.get('/', optionalAuth, controller.searchAll);

module.exports = router;
