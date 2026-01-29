const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    guest: {
        type: String,
        required: [true, 'Please add a guest name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    checkIn: {
        type: Date,
        required: [true, 'Please add a check-in date']
    },
    checkOut: {
        type: Date,
        required: [true, 'Please add a check-out date']
    },
    adults: {
        type: Number,
        default: 1
    },
    children: {
        type: Number,
        default: 0
    },
    room: {
        type: String,
        required: [true, 'Please add a room name']
    },
    roomNumber: {
        type: String,
        required: [true, 'Please add a room number']
    },
    amount: {
        type: Number,
        required: [true, 'Please add total amount']
    },
    advance: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    nights: {
        type: Number,
        required: true
    },
    specialRequests: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partial', 'Paid'],
        default: 'Pending'
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'],
        default: 'Pending'
    },
    source: {
        type: String,
        default: 'Dashboard'
    },
    bookingDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
