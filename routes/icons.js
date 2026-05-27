const express = require('express');
const { getAllIcons, getIconsByCategory, createIcon, deleteIcon } = require('../controllers/iconController');
const { protect } = require('../middleware/auth');

const { cacheMiddleware, clearCache } = require('../middleware/cache');

// Helper middleware to clear icons cache
const clearIconsCache = (req, res, next) => {
    clearCache('icons');
    next();
};

const router = express.Router();

// Public routes
router.get('/', cacheMiddleware('icons', 300), getAllIcons);
router.get('/category/:category', cacheMiddleware('icons', 300), getIconsByCategory);

// Protected routes
router.post('/', protect, clearIconsCache, createIcon);
router.delete('/:id', protect, clearIconsCache, deleteIcon);

module.exports = router;
