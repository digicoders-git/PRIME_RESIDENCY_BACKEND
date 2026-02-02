const Booking = require('../models/Booking');
const Room = require('../models/Room');

// Check and update room availability based on current bookings
exports.updateRoomAvailability = async () => {
    try {
        // Get all current bookings that should be checked out
        const expiredBookings = await Booking.find({
            status: { $in: ['Confirmed', 'Checked-in'] },
            checkOut: { $lt: new Date() }
        });

        // Auto checkout expired bookings
        for (const booking of expiredBookings) {
            await Booking.findByIdAndUpdate(booking._id, {
                status: 'Checked-out'
            });

            // Make room available again
            await Room.findOneAndUpdate(
                { roomNumber: booking.roomNumber },
                { status: 'Available' }
            );
        }

        console.log(`Updated ${expiredBookings.length} expired bookings`);
    } catch (error) {
        console.error('Error updating room availability:', error);
    }
};

// Check if a room is available for given dates
exports.isRoomAvailable = async (roomNumber, checkIn, checkOut, excludeBookingId = null) => {
    try {
        const query = {
            roomNumber: roomNumber,
            status: { $in: ['Confirmed', 'Checked-in'] },
            $or: [
                {
                    checkIn: { $lte: new Date(checkIn) },
                    checkOut: { $gt: new Date(checkIn) }
                },
                {
                    checkIn: { $lt: new Date(checkOut) },
                    checkOut: { $gte: new Date(checkOut) }
                },
                {
                    checkIn: { $gte: new Date(checkIn) },
                    checkOut: { $lte: new Date(checkOut) }
                }
            ]
        };

        // Exclude current booking when updating
        if (excludeBookingId) {
            query._id = { $ne: excludeBookingId };
        }

        const conflictingBooking = await Booking.findOne(query);
        return !conflictingBooking;
    } catch (error) {
        console.error('Error checking room availability:', error);
        return false;
    }
};

// Get all available rooms for given dates
exports.getAvailableRoomsForDates = async (checkIn, checkOut) => {
    try {
        // Get all visible rooms
        const allRooms = await Room.find({ visibility: true, status: { $ne: 'Maintenance' } });
        
        // Get booked rooms for the date range
        const bookedRooms = await Booking.find({
            status: { $in: ['Confirmed', 'Checked-in'] },
            $or: [
                {
                    checkIn: { $lte: new Date(checkIn) },
                    checkOut: { $gt: new Date(checkIn) }
                },
                {
                    checkIn: { $lt: new Date(checkOut) },
                    checkOut: { $gte: new Date(checkOut) }
                },
                {
                    checkIn: { $gte: new Date(checkIn) },
                    checkOut: { $lte: new Date(checkOut) }
                }
            ]
        }).select('roomNumber');
        
        const bookedRoomNumbers = bookedRooms.map(booking => booking.roomNumber);
        
        // Filter available rooms
        const availableRooms = allRooms.filter(room => 
            !bookedRoomNumbers.includes(room.roomNumber)
        );
        
        return availableRooms;
    } catch (error) {
        console.error('Error getting available rooms:', error);
        return [];
    }
};