const Revenue = require('../models/Revenue');
const Booking = require('../models/Booking');

// Test endpoint to check revenue data
exports.testRevenueData = async (req, res) => {
    try {
        const allRevenue = await Revenue.find().sort({ date: -1 });
        const allBookings = await Booking.find().sort({ createdAt: -1 });
        
        console.log('All Revenue Records:', allRevenue);
        console.log('All Bookings:', allBookings);
        
        res.status(200).json({
            success: true,
            data: {
                revenueCount: allRevenue.length,
                bookingCount: allBookings.length,
                revenueRecords: allRevenue,
                bookingRecords: allBookings
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};