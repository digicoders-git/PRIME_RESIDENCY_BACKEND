const express = require('express');
const multer = require('multer');
const {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.post('/', protect, upload.single('image'), createService);
router.put('/:id', protect, upload.single('image'), updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;