const express = require('express');
const multer = require('multer');
const {
    getReviews,
    getReview,
    createReview,
    updateReview,
    deleteReview,
    approveReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

router
    .route('/')
    .get(getReviews) // Public for website
    .post(upload.single('customerImage'), createReview); // Public for website

router
    .route('/:id')
    .get(getReview)
    .put(protect, updateReview)
    .delete(protect, deleteReview);

router
    .route('/:id/approve')
    .put(protect, approveReview);

module.exports = router;
