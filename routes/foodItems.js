const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    getFoodItems, 
    createFoodItem, 
    updateFoodItem, 
    deleteFoodItem,
    getFoodCategories,
    createFoodCategory,
    deleteFoodCategory
} = require('../controllers/foodController');

router.get('/', protect, getFoodItems);
router.post('/', protect, createFoodItem);
router.put('/:id', protect, updateFoodItem);
router.delete('/:id', protect, deleteFoodItem);

// Categories routes
router.get('/categories', protect, getFoodCategories);
router.post('/categories', protect, createFoodCategory);
router.delete('/categories/:id', protect, deleteFoodCategory);

module.exports = router;
