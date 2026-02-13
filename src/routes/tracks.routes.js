const express = require('express');
const router = express.Router();
const albumTracks = require('../controllers/album.controller');
const authMiddleware = require('../middlewares/auth.middleware');
router.use(authMiddleware);

router.get('/:albumId', albumTracks.getAlbumTracksForUser);


module.exports = router;
