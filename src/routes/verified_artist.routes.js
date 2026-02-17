const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artist.controller');
const authMiddleware = require('../middlewares/auth.middleware');
router.use(authMiddleware);

router.get('/:artistId', artistController.getVerifiedArtistById);
router.get('/:artistId/songs', artistController.getArtistSongs);
router.get('/:artistId/albums', artistController.getArtistAlbums);


module.exports = router;
