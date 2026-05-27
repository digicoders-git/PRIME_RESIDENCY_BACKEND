const express = require('express');
const multer = require('multer');
const {
    getGallery,
    uploadImage,
    deleteImage
} = require('../controllers/galleryController');
const { protect } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// Helper middleware to clear gallery cache
const clearGalleryCache = (req, res, next) => {
    clearCache('gallery');
    next();
};

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
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
    .get(cacheMiddleware('gallery', 300), getGallery) // Public for website, cached for 5 minutes
    .post(protect, upload.single('image'), clearGalleryCache, uploadImage);

router
    .route('/:id')
    .delete(protect, clearGalleryCache, deleteImage);

module.exports = router;
