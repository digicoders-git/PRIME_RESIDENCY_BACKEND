const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Revenue = require('../models/Revenue');

// console.log('Razorpay credentials:', {
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing'
// });

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Razorpay webhook handler
// @route   POST /api/payment/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(req.body);
        
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
            .update(webhookBody)
            .digest('hex');

        if (webhookSignature === expectedSignature) {
            const { event, payload } = req.body;
            
            if (event === 'payment.captured') {
                const { order_id, id: payment_id, amount } = payload.payment.entity;
                
                // Find booking by razorpay order id
                const booking = await Booking.findOne({ razorpayOrderId: order_id });
                
                if (booking) {
                    const paidAmount = amount / 100; // Convert paise to rupees
                    const newBalance = Math.max(0, booking.amount - paidAmount);
                    
                    await Booking.findByIdAndUpdate(booking._id, {
                        paymentStatus: 'Paid',
                        advance: paidAmount,
                        balance: newBalance,
                        razorpayPaymentId: payment_id,
                        status: booking.status === 'Pending' ? 'Confirmed' : booking.status
                    });
                    
                    console.log('Webhook: Payment captured for booking', booking._id);
                }
            }
            
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Public
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        console.log('Creating Razorpay order:', { amount, currency, receipt });

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);
        
        console.log('Razorpay order created:', order);
        
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Public
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, amount } = req.body;

        console.log('Payment verification request:', { razorpay_order_id, razorpay_payment_id, bookingId, amount });

        // First get the booking to verify amount
        const existingBooking = await Booking.findById(bookingId);
        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        console.log('Signature verification:', { expectedSignature, receivedSignature: razorpay_signature });

        if (expectedSignature === razorpay_signature) {
            // Payment is verified, update booking
            const paidAmount = amount || existingBooking.amount;
            const newBalance = existingBooking.amount - paidAmount;
            
            const booking = await Booking.findByIdAndUpdate(
                bookingId,
                {
                    paymentStatus: 'Paid',
                    advance: paidAmount,
                    balance: Math.max(0, newBalance),
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    status: existingBooking.status === 'Pending' ? 'Confirmed' : existingBooking.status
                },
                { new: true }
            );

            // Create revenue record for successful payment
            await Revenue.create({
                source: 'Room Booking',
                amount: paidAmount,
                description: `Online payment for ${existingBooking.guest} - ${existingBooking.room}`,
                bookingId: bookingId,
                bookingSource: existingBooking.source,
                paymentMethod: 'Online',
                status: 'Received',
                date: new Date()
            });

            console.log('Booking updated successfully:', booking);

            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                data: booking
            });
        } else {
            console.log('Payment verification failed - signature mismatch');
            res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};