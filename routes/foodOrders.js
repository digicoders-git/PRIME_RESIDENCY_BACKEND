const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createFoodOrder, getFoodOrders, updateOrderStatus, deleteOrder } = require('../controllers/foodOrderController');

router.post('/', createFoodOrder);
router.get('/', protect, getFoodOrders);
router.put('/:id/status', protect, updateOrderStatus);
router.delete('/:id', protect, deleteOrder);

module.exports = router;
