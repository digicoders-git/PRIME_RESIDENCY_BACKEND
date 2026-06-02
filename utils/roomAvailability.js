const Booking = require('../models/Booking');
const Room = require('../models/Room');

// Check and update room availability based on current bookings (optimized bulk implementation)
exports.updateRoomAvailability = async () => {
    try {
        // 1. Get all active bookings
        const activeBookings = await Booking.find({
            status: { $in: ['Confirmed', 'Checked-in'] }
        }).select('roomNumber property category').lean();

        // 2. Build a quick lookup Set of active booked room keys
        const bookedRoomKeys = new Set(
            activeBookings.map(b => `${b.roomNumber}_${b.property}_${b.category || 'Room'}`)
        );

        // 3. Get all rooms
        const allRooms = await Room.find({}).lean();

        // 4. Identify rooms that actually need status updates
        const bulkOps = [];
        for (const room of allRooms) {
            const isBooked = bookedRoomKeys.has(`${room.roomNumber}_${room.property}_${room.category || 'Room'}`);
            const expectedStatus = isBooked ? 'Booked' : 'Available';

            if (room.status !== expectedStatus && room.status !== 'Maintenance') {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: room._id },
                        update: { $set: { status: expectedStatus } }
                    }
                });
            }
        }

        // 5. Run bulk updates if any room status changed
        if (bulkOps.length > 0) {
            await Room.bulkWrite(bulkOps);
            console.log(`[AVAILABILITY] Bulk updated ${bulkOps.length} rooms' availability statuses.`);
        }
    } catch (error) {
        console.error('Error in optimized updateRoomAvailability:', error);
    }
};

// Check if a room is available for given dates
exports.isRoomAvailable = async (roomNumber, checkIn, checkOut, excludeBookingId = null, property = null, category = null) => {
    try {
        if (!checkIn || !checkOut) {
            return true;
        }
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

        if (property) query.property = property;
        if (category) query.category = category;
        if (excludeBookingId) query._id = { $ne: excludeBookingId };

        const conflictingBooking = await Booking.findOne(query);
        return !conflictingBooking;
    } catch (error) {
        // console.error('Error checking room availability:', error);
        return false;
    }
};

// Get all available rooms for given dates
exports.getAvailableRoomsForDates = async (checkIn, checkOut) => {
    try {
        // Get all visible rooms
        const allRooms = await Room.find({ visibility: true, status: { $ne: 'Maintenance' } });

        if (!checkIn || !checkOut) {
            return allRooms;
        }

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
        }).select('roomNumber property');

        const bookedRoomKeys = bookedRooms.map(booking => `${booking.roomNumber}_${booking.property}`);

        // Filter available rooms
        const availableRooms = allRooms.filter(room =>
            !bookedRoomKeys.includes(`${room.roomNumber}_${room.property}`)
        );

        return availableRooms;
    } catch (error) {
        // console.error('Error getting available rooms:', error);
        return [];
    }
};