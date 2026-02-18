const express = require('express');
const {
    getRevenue,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    getRevenueAnalytics
} = require('../controllers/revenueController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(protect, getRevenue)
    .post(protect, createRevenue);

router.route('/analytics')
    .get(protect, getRevenueAnalytics);

router.route('/:id')
    .put(protect, updateRevenue)
    .delete(protect, deleteRevenue);

module.exports = router;