const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authMiddleware, controller.me);
router.post('/logout', authMiddleware, controller.logout);

module.exports = router;
