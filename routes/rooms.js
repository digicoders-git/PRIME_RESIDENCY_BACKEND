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
    .get(protect, updateAvailabilityMiddleware, getRooms)
    .post(protect, uploadFields, createRoom);

// Route to get available rooms for booking
router.route('/available')
    .get(updateAvailabilityMiddleware, getAvailableRooms); // Public for website

// Route to get room by room number (for URL privacy)
router.route('/by-number/:roomNumber')
    .get(getRoomByNumber); // Public for website

router
    .route('/:id')
    .get(getRoom)
    .put(protect, uploadFields, updateRoom)
    .delete(protect, deleteRoom);

module.exports = router;
