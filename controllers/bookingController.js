const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Revenue = require('../models/Revenue');
const { isRoomAvailable, updateRoomAvailability } = require('../utils/roomAvailability');

const { uploadToCloudinary } = require('../utils/cloudinary');
const { saveImageBackup } = require('../utils/imageBackup');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
exports.getBookings = async (req, res) => {
    try {
        await updateRoomAvailability();

        let query = {};

        // CRITICAL: Manager can ONLY see their property bookings
        if (req.user && req.user.role === 'Manager') {
            if (!req.user.property) {
                console.warn('⚠ Manager has no property assigned!');
                return res.status(200).json({ success: true, count: 0, data: [] });
            }
            query.property = req.user.property;
            console.log('✓ Manager filter applied:', query.property);
        } else if (req.query.property && req.query.property !== 'All') {
            query.property = req.query.property;
            console.log('✓ Admin filter applied:', query.property);
        } else {
            console.log('✓ No property filter (Admin viewing all)');
        }

        const bookings = await Booking.find(query).sort({ createdAt: -1 });
        console.log(`✓ Found ${bookings.length} bookings`);
        
        // Log first booking's property for debugging
        if (bookings.length > 0) {
            console.log('Sample booking property:', bookings[0].property, 'Guest:', bookings[0].guest);
        }
        
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        console.error('❌ getBookings error:', err);
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
        console.log('=== CREATE BOOKING REQUEST ===');
        console.log('Body:', req.body);
        console.log('Files:', req.files);
        
        const bookingData = { ...req.body };

        // Handle file uploads if present
        if (req.files) {
            if (req.files.idFrontImage) {
                const result = await uploadToCloudinary(req.files.idFrontImage[0].buffer, 'bookings');
                bookingData.idFrontImage = result.secure_url;
                // Save local backup - extract just the filename from public_id
                const filename = result.public_id.split('/').pop();
                await saveImageBackup(req.files.idFrontImage[0].buffer, filename, 'bookings');
            }
            if (req.files.idBackImage) {
                const result = await uploadToCloudinary(req.files.idBackImage[0].buffer, 'bookings');
                bookingData.idBackImage = result.secure_url;
                // Save local backup - extract just the filename from public_id
                const filename = result.public_id.split('/').pop();
                await saveImageBackup(req.files.idBackImage[0].buffer, filename, 'bookings');
            }
        }

        // Parse numeric fields if they are sent as strings via FormData
        ['amount', 'advance', 'balance', 'nights', 'adults', 'children'].forEach(field => {
            if (bookingData[field] !== undefined && bookingData[field] !== null) {
                bookingData[field] = Number(bookingData[field]);
            }
        });

        if (bookingData.extraBed === 'true') bookingData.extraBed = true;
        if (bookingData.extraBed === 'false') bookingData.extraBed = false;

        // Fetch room using number and property
        const roomSearchQuery = { roomNumber: bookingData.roomNumber };
        const propertyToUse = bookingData.property || (req.user && req.user.property);

        if (propertyToUse) {
            roomSearchQuery.property = propertyToUse;
        } else {
            console.warn('⚠ Booking creation attempted without property context for room:', bookingData.roomNumber);
            return res.status(400).json({
                success: false,
                message: 'Property context is required to identify the room correctly.'
            });
        }

        console.log('🔍 Searching for room:', roomSearchQuery);
        const room = await Room.findOne(roomSearchQuery);
        if (!room) {
            console.error('❌ Room not found with query:', roomSearchQuery);
            return res.status(404).json({ success: false, message: 'Room not found in specified property' });
        }
        bookingData.property = room.property;
        console.log('✅ Room found, setting booking property to:', room.property);

        // Check if room is available for the given dates
        const available = await isRoomAvailable(
            bookingData.roomNumber,
            bookingData.checkIn,
            bookingData.checkOut,
            null,
            room.property // Pass property for uniqueness
        );

        if (!available) {
            return res.status(400).json({
                success: false,
                message: 'Room is already booked for the selected dates'
            });
        }

        // Ensure status is Pending if payment is not completed
        if (bookingData.paymentStatus !== 'Paid' && bookingData.paymentStatus !== 'Partial') {
            bookingData.status = 'Pending';
        }

        const booking = await Booking.create(bookingData);

        // Record revenue if there's an advance payment
        if (booking.advance > 0) {
            await Revenue.create({
                source: 'Room Booking',
                amount: booking.advance,
                description: `Booking payment for ${booking.guest} - ${booking.room} (${booking.roomNumber})`,
                bookingId: booking._id,
                bookingSource: booking.source || 'Direct',
                paymentMethod: booking.razorpayPaymentId ? 'Online' : 'Cash',
                status: 'Received',
                date: new Date(),
                property: booking.property // Assign property to revenue
            });
        }

        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        console.error('=== CREATE BOOKING ERROR ===');
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private/Admin
exports.updateBooking = async (req, res) => {
    try {
        const oldBooking = await Booking.findById(req.params.id);
        // If cancelling, set balance to 0 and update revenue status
        if (req.body.status === 'Cancelled') {
            req.body.balance = 0;
            req.body.paymentStatus = 'Cancelled';

            // Mark any existing revenue as Refunded
            await Revenue.updateMany(
                { bookingId: req.params.id },
                { status: 'Refunded', description: `Refunded for cancelled booking` }
            );
        }

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
                    date: new Date(),
                    property: booking.property
                });
            }
        }

        // Update room status to Booked when payment is complete and status is Confirmed/Checked-in
        if (oldBooking.status !== booking.status &&
            (booking.status === 'Confirmed' || booking.status === 'Checked-in') &&
            booking.paymentStatus === 'Paid') {
            await Room.findOneAndUpdate(
                { roomNumber: booking.roomNumber, property: booking.property },
                { status: 'Booked' }
            );
        }

        // Update room status when booking is checked out or cancelled
        if (oldBooking.status !== booking.status &&
            (booking.status === 'Checked-out' || booking.status === 'Cancelled')) {
            await Room.findOneAndUpdate(
                { roomNumber: booking.roomNumber, property: booking.property },
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

        // Calculate total amount including food orders and extra charges
        const foodTotal = (booking.foodOrders || []).reduce((sum, order) => sum + (order.amount || 0), 0);
        const extraChargesTotal = (booking.extraCharges || []).reduce((sum, charge) => sum + (charge.amount || 0), 0);
        const totalAmount = booking.amount + foodTotal + extraChargesTotal;

        const advanceAmount = Number(advance) || 0;
        const previousAdvance = booking.advance || 0;
        const newAdvance = previousAdvance + advanceAmount;
        const newBalance = Math.max(0, totalAmount - newAdvance);

        let paymentStatus = 'Pending';
        if (newBalance <= 0 && totalAmount > 0) {
            paymentStatus = 'Paid';
        } else if (newAdvance > 0 && newBalance > 0) {
            paymentStatus = 'Partial';
        }

        console.log('Updating payment:', {
            bookingId: req.params.id,
            roomAmount: booking.amount,
            foodTotal,
            extraChargesTotal,
            totalAmount,
            previousAdvance,
            newPayment: advanceAmount,
            newAdvance,
            newBalance,
            paymentStatus
        });

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                advance: newAdvance,
                balance: newBalance,
                paymentStatus: paymentStatus
            },
            { new: true, runValidators: true }
        );

        // Update room status to Booked only when payment is complete
        if (paymentStatus === 'Paid') {
            await Room.findOneAndUpdate(
                { roomNumber: booking.roomNumber, property: booking.property },
                { status: 'Booked' }
            );
        }

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
                    date: new Date(),
                    property: booking.property
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

// @desc    Add food order to booking
// @route   POST /api/bookings/:id/food-order
// @access  Private/Admin
exports.addFoodOrder = async (req, res) => {
    try {
        const { item, quantity, price } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const orderAmount = Number(quantity || 1) * Number(price);
        const foodOrder = {
            item,
            quantity: Number(quantity) || 1,
            price: Number(price),
            amount: orderAmount,
            date: new Date()
        };

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                $push: { foodOrders: foodOrder },
                $inc: { amount: orderAmount, balance: orderAmount }
            },
            { new: true }
        );

        res.status(200).json({ success: true, data: updatedBooking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Add extra charge to booking
// @route   POST /api/bookings/:id/extra-charge
// @access  Private/Admin
exports.addExtraCharge = async (req, res) => {
    try {
        const { description, amount } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const chargeAmount = Number(amount);
        const extraCharge = {
            description,
            amount: chargeAmount,
            date: new Date()
        };

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                $push: { extraCharges: extraCharge },
                $inc: { amount: chargeAmount, balance: chargeAmount }
            },
            { new: true }
        );

        res.status(200).json({ success: true, data: updatedBooking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Delete the booking first
        await Booking.findByIdAndDelete(req.params.id);

        // Check if there are any other active bookings for this room
        const activeBookings = await Booking.find({
            roomNumber: booking.roomNumber,
            property: booking.property,
            status: { $in: ['Confirmed', 'Checked-in'] }
        });

        // Update room status based on remaining bookings
        const newRoomStatus = activeBookings.length > 0 ? 'Booked' : 'Available';
        
        await Room.findOneAndUpdate(
            { roomNumber: booking.roomNumber, property: booking.property },
            { status: newRoomStatus }
        );

        console.log(`Booking deleted. Room ${booking.roomNumber} status set to: ${newRoomStatus}`);

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
