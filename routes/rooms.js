const express = require('express');
const multer = require('multer');
const updateAvailabilityMiddleware = require('../middleware/updateAvailability');
const {
    getRooms,
    getRoom,
    getRoomByNumber,
    getAvailableRooms,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');

const { protect } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// Helper middleware to clear rooms cache
const clearRoomsCache = (req, res, next) => {
    clearCache('rooms');
    next();
};

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
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
]);

router
    .route('/')
    .get(protect, updateAvailabilityMiddleware, cacheMiddleware('rooms', 120), getRooms)
    .post(protect, uploadFields, clearRoomsCache, createRoom);

// Route to get available rooms for booking
router.route('/available')
    .get(cacheMiddleware('rooms', 120), updateAvailabilityMiddleware, getAvailableRooms); // Public for website

// Route to get room by room number (for URL privacy)
router.route('/by-number/:roomNumber')
    .get(cacheMiddleware('rooms', 120), getRoomByNumber); // Public for website

router
    .route('/:id')
    .get(cacheMiddleware('rooms', 120), getRoom)
    .put(protect, uploadFields, clearRoomsCache, updateRoom)
    .delete(protect, clearRoomsCache, deleteRoom);

module.exports = router;
