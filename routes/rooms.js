const express = require('express');
const multer = require('multer');
const {
    getRooms,
    getRoom,
    getRoomByNumber,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit per file
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
    .get(getRooms)
    .post(uploadFields, createRoom);

// Route to get room by room number (for URL privacy)
router.route('/by-number/:roomNumber')
    .get(getRoomByNumber);

router
    .route('/:id')
    .get(getRoom)
    .put(uploadFields, updateRoom)
    .delete(deleteRoom);

module.exports = router;
