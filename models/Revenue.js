const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['Room Booking', 'Service', 'Food & Beverage', 'Event', 'Other'],
        required: true
    },
    bookingSource: {
        type: String,
        enum: ['Website', 'Dashboard'],
        required: false
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: false
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Online'],
        default: 'Cash'
    },
    status: {
        type: String,
        enum: ['Received', 'Pending', 'Refunded'],
        default: 'Received'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Revenue', revenueSchema);