const router = require('express').Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

// Get user profile
router.get('/profile', auth, userController.getProfile);

// Update user profile
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
