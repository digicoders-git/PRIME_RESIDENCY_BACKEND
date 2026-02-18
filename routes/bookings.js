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
    getBookingHistory,
    addFoodOrder,
    addExtraCharge
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

// Wrapper to handle multer errors properly
const uploadFieldsWithErrorHandling = (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

router
    .route('/')
    .get(updateAvailabilityMiddleware, getBookings)
    .post(uploadFieldsWithErrorHandling, createBooking);

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

router
    .route('/:id/food-order')
    .post(addFoodOrder);

router
    .route('/:id/extra-charge')
    .post(addExtraCharge);

module.exports = router;
