const { updateRoomAvailability } = require('../utils/roomAvailability');

// Middleware to update room availability before processing requests
const updateAvailabilityMiddleware = async (req, res, next) => {
    try {
        // Update room availability for expired bookings
        await updateRoomAvailability();
        next();
    } catch (error) {
        console.error('Error updating room availability:', error);
        // Continue with request even if availability update fails
        next();
    }
};

module.exports = updateAvailabilityMiddleware;