const express = require('express');
const {
    getConfigsByType,
    getAllConfigs,
    createConfig,
    deleteConfig
} = require('../controllers/roomConfigController');
const { protect } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// Helper middleware to clear roomConfig cache
const clearRoomConfigCache = (req, res, next) => {
    clearCache('room-config');
    next();
};

const router = express.Router();

router.get('/', cacheMiddleware('room-config', 300), getAllConfigs);
router.get('/:type', cacheMiddleware('room-config', 300), getConfigsByType);
router.post('/', protect, clearRoomConfigCache, createConfig);
router.delete('/:id', protect, clearRoomConfigCache, deleteConfig);

module.exports = router;
