const router = require('express').Router();
const controller = require('../controllers/song.controller');
const auth = require('../middlewares/auth.middleware');
const artist = require('../middlewares/artist.middleware');
const admin = require('../middlewares/admin.middleware');

// artist
router.post('/', auth, artist, controller.createSong);
router.get('/my', auth, artist, controller.getMySongs);
router.patch('/:id', auth, artist, controller.updateSong);

// admin
router.get('/admin/pending', auth, admin, controller.getPendingSongs);
router.get('/admin/pending/individual', auth, admin, controller.getPendingIndividualSongs);
router.get('/admin/pending/album', auth, admin, controller.getPendingAlbumSongs);
router.post('/admin/approve', auth, admin, controller.approveSong);
router.post('/admin/reject', auth, admin, controller.rejectSong);
router.post('/admin/create-for-artist', auth, admin, controller.createSongOnBehalfOfArtist);

module.exports = router;
