const express = require('express');
const {
    getRevenue,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    getRevenueAnalytics
} = require('../controllers/revenueController');

const router = express.Router();

router.route('/')
    .get(getRevenue)
    .post(createRevenue);

router.route('/analytics')
    .get(getRevenueAnalytics);

router.route('/:id')
    .put(updateRevenue)
    .delete(deleteRevenue);

module.exports = router;