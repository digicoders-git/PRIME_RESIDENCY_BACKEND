const express = require('express');
const updateAvailabilityMiddleware = require('../middleware/updateAvailability');
const multer = require('multer');
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

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit per file
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

const uploadFields = upload.fields([
    { name: 'idFrontImage', maxCount: 1 },
    { name: 'idBackImage', maxCount: 1 }
]);

router
    .route('/')
    .get(updateAvailabilityMiddleware, getBookings)
    .post(uploadFields, createBooking);

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
