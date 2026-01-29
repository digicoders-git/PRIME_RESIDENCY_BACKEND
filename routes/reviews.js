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
    .get(getReviews)
    .post(upload.single('customerImage'), createReview);

router
    .route('/:id')
    .get(getReview)
    .put(updateReview)
    .delete(deleteReview);

router
    .route('/:id/approve')
    .put(approveReview);

module.exports = router;
