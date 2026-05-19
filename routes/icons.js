const express = require('express');
const { getAllIcons, getIconsByCategory, createIcon, deleteIcon } = require('../controllers/iconController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllIcons);
router.get('/category/:category', getIconsByCategory);

// Protected routes
router.post('/', protect, createIcon);
router.delete('/:id', protect, deleteIcon);

module.exports = router;
