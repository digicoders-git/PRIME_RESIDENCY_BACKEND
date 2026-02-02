const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Revenue = require('../models/Revenue');
const { isRoomAvailable, updateRoomAvailability } = require('../utils/roomAvailability');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
exports.getBookings = async (req, res) => {
    try {
        // Update room availability before fetching bookings
        await updateRoomAvailability();
        
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private/Admin
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        console.log('Fetched booking:', {
            id: booking._id,
            guest: booking.guest,
            paymentStatus: booking.paymentStatus,
            advance: booking.advance,
            balance: booking.balance,
            status: booking.status
        });
        
        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        console.error('Get booking error:', err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public (for website) or Private (for Admin)
exports.createBooking = async (req, res) => {
    try {
        // Check if room is available for the given dates
        const available = await isRoomAvailable(
            req.body.roomNumber, 
            req.body.checkIn, 
            req.body.checkOut
        );
        
        if (!available) {
            return res.status(400).json({ 
                success: false, 
                message: 'Room is already booked for the selected dates' 
            });
        }
        
        const booking = await Booking.create(req.body);
        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private/Admin
exports.updateBooking = async (req, res) => {
    try {
        const oldBooking = await Booking.findById(req.params.id);
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Auto-create revenue when status changes to Confirmed or Checked-in
        if (oldBooking.status !== booking.status && 
            (booking.status === 'Confirmed' || booking.status === 'Checked-in')) {
            
            // Check if revenue already exists for this booking
            const existingRevenue = await Revenue.findOne({ bookingId: booking._id });
            
            if (!existingRevenue && booking.advance > 0) {
                await Revenue.create({
                    source: 'Room Booking',
                    amount: booking.advance,
                    description: `Room booking payment for ${booking.guest} - ${booking.room} (${booking.roomNumber})`,
                    bookingId: booking._id,
                    bookingSource: booking.source,
                    paymentMethod: booking.source === 'Website' ? 'Online' : 'Cash',
                    status: 'Received',
                    date: new Date()
                });
            }
        }
        
        // Update room status when booking is checked out or cancelled
        if (oldBooking.status !== booking.status && 
            (booking.status === 'Checked-out' || booking.status === 'Cancelled')) {
            await Room.findOneAndUpdate(
                { roomNumber: booking.roomNumber },
                { status: 'Available' }
            );
        }

        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update booking payment
// @route   PUT /api/bookings/:id/payment
// @access  Private/Admin
exports.updateBookingPayment = async (req, res) => {
    try {
        const { advance, paymentMethod } = req.body;
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const advanceAmount = Number(advance) || 0;
        const newBalance = Math.max(0, booking.amount - advanceAmount);
        
        let paymentStatus = 'Pending';
        if (advanceAmount >= booking.amount) {
            paymentStatus = 'Paid';
        } else if (advanceAmount > 0) {
            paymentStatus = 'Partial';
        }

        console.log('Updating payment:', { 
            bookingId: req.params.id, 
            advance: advanceAmount, 
            balance: newBalance, 
            paymentStatus 
        });

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { 
                advance: advanceAmount,
                balance: newBalance,
                paymentStatus: paymentStatus
            },
            { new: true, runValidators: true }
        );

        // Update revenue record if exists, or create new one for payments
        if (advance > 0) {
            const existingRevenue = await Revenue.findOne({ bookingId: booking._id });
            
            if (existingRevenue) {
                await Revenue.findOneAndUpdate(
                    { bookingId: booking._id },
                    { 
                        amount: advance,
                        status: 'Received',
                        paymentMethod: paymentMethod || 'Cash',
                        bookingSource: booking.source
                    }
                );
            } else {
                await Revenue.create({
                    source: 'Room Booking',
                    amount: advance,
                    description: `Payment for ${booking.guest} - ${booking.room}`,
                    bookingId: booking._id,
                    bookingSource: booking.source,
                    paymentMethod: paymentMethod || 'Cash',
                    status: 'Received',
                    date: new Date()
                });
            }
        }

        console.log('Payment updated successfully:', updatedBooking);

        res.status(200).json({ success: true, data: updatedBooking });
    } catch (err) {
        console.error('Payment update error:', err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get booking history by email/phone
// @route   GET /api/bookings/history/:identifier
// @access  Public
exports.getBookingHistory = async (req, res) => {
    try {
        const { identifier } = req.params;
        const bookings = await Booking.find({
            $or: [
                { email: identifier },
                { phone: identifier }
            ]
        }).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
