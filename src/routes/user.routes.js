const router = require('express').Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

// Get user profile
router.get('/profile', auth, userController.getProfile);

// Update user profile
router.put('/profile', auth, userController.updateProfile);

// Delete account (App Store required)
router.delete('/profile', auth, userController.deleteAccount);

module.exports = router;
