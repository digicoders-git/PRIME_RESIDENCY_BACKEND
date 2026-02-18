const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getFoodItems, createFoodItem, updateFoodItem, deleteFoodItem } = require('../controllers/foodController');

router.get('/', protect, getFoodItems);
router.post('/', protect, createFoodItem);
router.put('/:id', protect, updateFoodItem);
router.delete('/:id', protect, deleteFoodItem);

module.exports = router;
