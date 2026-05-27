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
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// Helper middleware to clear reviews cache
const clearReviewsCache = (req, res, next) => {
    clearCache('reviews');
    next();
};

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
    .get(cacheMiddleware('reviews', 300), getReviews) // Public for website, cached 5 min
    .post(upload.single('customerImage'), clearReviewsCache, createReview); // Public for website

router
    .route('/:id')
    .get(cacheMiddleware('reviews', 300), getReview)
    .put(protect, clearReviewsCache, updateReview)
    .delete(protect, clearReviewsCache, deleteReview);

router
    .route('/:id/approve')
    .put(protect, clearReviewsCache, approveReview);

module.exports = router;
