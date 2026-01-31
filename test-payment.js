const mongoose = require('mongoose');
const Booking = require('./models/Booking');
require('dotenv').config();

// Test payment status update
async function testPaymentUpdate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a test booking
        const booking = await Booking.findOne().sort({ createdAt: -1 });
        
        if (!booking) {
            console.log('No bookings found');
            return;
        }

        console.log('Before update:', {
            id: booking._id,
            guest: booking.guest,
            paymentStatus: booking.paymentStatus,
            advance: booking.advance,
            balance: booking.balance,
            amount: booking.amount
        });

        // Simulate payment update
        const updatedBooking = await Booking.findByIdAndUpdate(
            booking._id,
            {
                paymentStatus: 'Paid',
                advance: booking.amount,
                balance: 0,
                razorpayOrderId: 'test_order_' + Date.now(),
                razorpayPaymentId: 'test_payment_' + Date.now()
            },
            { new: true }
        );

        console.log('After update:', {
            id: updatedBooking._id,
            guest: updatedBooking.guest,
            paymentStatus: updatedBooking.paymentStatus,
            advance: updatedBooking.advance,
            balance: updatedBooking.balance,
            amount: updatedBooking.amount
        });

        console.log('Payment status update test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testPaymentUpdate();