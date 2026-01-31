const express = require('express');
const {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    updateBookingPayment,
    getBookingHistory
} = require('../controllers/bookingController');

const router = express.Router();

router
    .route('/')
    .get(getBookings)
    .post(createBooking);

router
    .route('/:id')
    .get(getBooking)
    .put(updateBooking)
    .delete(deleteBooking);

router
    .route('/history/:identifier')
    .get(getBookingHistory);

router
    .route('/:id/payment')
    .put(updateBookingPayment);

module.exports = router;
