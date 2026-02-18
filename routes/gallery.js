const express = require('express');
const multer = require('multer');
const {
    getGallery,
    uploadImage,
    deleteImage
} = require('../controllers/galleryController');
const { protect } = require('../middleware/auth');

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
    .get(getGallery) // Public for website, but filters by property if authenticated
    .post(protect, upload.single('image'), uploadImage);

router
    .route('/:id')
    .delete(protect, deleteImage);

module.exports = router;
