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
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// Helper middleware to clear services cache
const clearServicesCache = (req, res, next) => {
    clearCache('services');
    next();
};

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

router.get('/', cacheMiddleware('services', 300), getAllServices);
router.get('/:id', cacheMiddleware('services', 300), getServiceById);
router.post('/', protect, upload.single('image'), clearServicesCache, createService);
router.put('/:id', protect, upload.single('image'), clearServicesCache, updateService);
router.delete('/:id', protect, clearServicesCache, deleteService);

module.exports = router;