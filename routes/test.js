const express = require('express');
const { testRevenueData } = require('../controllers/testController');

const router = express.Router();

router.get('/revenue-data', testRevenueData);

module.exports = router;