const express = require('express');
const {
    getGuests,
    getGuest,
    updateGuest
} = require('../controllers/guestController');

const router = express.Router();

router.get('/', getGuests);
router.route('/:id').get(getGuest).put(updateGuest);

module.exports = router;
