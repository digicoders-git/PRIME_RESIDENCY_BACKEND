const express = require('express');
const {
    getGuests,
    getGuest,
    updateGuest
} = require('../controllers/guestController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getGuests);
router.route('/:id').get(protect, getGuest).put(protect, updateGuest);

module.exports = router;
