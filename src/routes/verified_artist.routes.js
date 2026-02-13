const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artist.controller');
const authMiddleware = require('../middlewares/auth.middleware');
router.use(authMiddleware);

router.get('/:artistId', artistController.getVerifiedArtistById);


module.exports = router;
