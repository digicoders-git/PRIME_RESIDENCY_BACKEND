const express = require('express');
const { createOrder, verifyPayment, handleWebhook } = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);

module.exports = router;