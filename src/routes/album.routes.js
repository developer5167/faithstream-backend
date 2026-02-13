const router = require('express').Router();
const controller = require('../controllers/album.controller');
const auth = require('../middlewares/auth.middleware');
const artist = require('../middlewares/artist.middleware');
const admin = require('../middlewares/admin.middleware');

// artist
router.post('/', auth, artist, controller.createAlbum);
router.get('/my', auth, artist, controller.getMyAlbums);
router.patch('/:id', auth, artist, controller.updateAlbum);
router.post('/submit', auth, artist, controller.submitAlbum);

// admin
router.get('/admin/pending', auth, admin, controller.getPendingAlbums);
router.get('/admin/:albumId/tracks', auth, admin, controller.getAlbumTracks);
router.post('/admin/approve', auth, admin, controller.approveAlbum);
router.post('/admin/reject', auth, admin, controller.rejectAlbum);
router.post('/admin/create-for-artist', auth, admin, controller.createAlbumOnBehalfOfArtist);
router.post('/admin/submit-for-artist', auth, admin, controller.submitAlbumOnBehalfOfArtist);
router.patch('/admin/:id', auth, admin, controller.updateAlbumByAdmin);

module.exports = router;
