
const router = require('express').Router();
const controller = require('../controllers/redirect.controller');

router.get('/song/:id', controller.shareSong);
router.get('/album/:id', controller.shareAlbum);
router.get('/artist/:id', controller.shareArtist);

module.exports = router;
