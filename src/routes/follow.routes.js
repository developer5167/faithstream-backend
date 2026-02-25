const express = require('express');
const router = express.Router();
const followController = require('../controllers/follow.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All follow routes require authentication
router.use(authMiddleware);

router.post('/:artistId', followController.followArtist);
router.delete('/:artistId', followController.unfollowArtist);
router.get('/:artistId/check', followController.checkFollowing);
router.get('/top', followController.getTopArtists);

module.exports = router;
