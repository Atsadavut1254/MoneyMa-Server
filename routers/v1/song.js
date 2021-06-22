const { Router } = require('express');
const router = Router({ mergeParams: true });

const { protect } = require('../../middleware/authentication');
const {
    acceptSong,
    // updateSong,
    getSongByUserId,
    getListSongs
} = require('../../controller/song');

router.route('/:cardId').post(acceptSong);

router.route('/guest/').get(protect, getListSongs);

// router.route('/:songId').patch(updateSong);

router.route('/user/:userId').get(getSongByUserId);
module.exports = router;
