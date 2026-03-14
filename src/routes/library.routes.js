const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/library.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All library routes require authentication
router.use(authMiddleware);

// GET /library/bootstrap - Get consolidated library data
router.get('/bootstrap', libraryController.getLibraryBootstrap);

module.exports = router;
