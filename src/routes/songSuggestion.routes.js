const router = require('express').Router();
const controller = require('../controllers/songSuggestion.controller');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

// Public route for users to suggest songs
router.post('/', controller.createSuggestion);

// Admin-only routes to manage suggestions
router.get('/', auth, admin, controller.getSuggestions);
router.delete('/:id', auth, admin, controller.deleteSuggestion);

module.exports = router;
