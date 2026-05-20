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
    },
    property: {
        type: String,
        enum: ['Prime Residency', 'Prem Kunj'],
        required: [true, 'Please assign a property']
    }
}, {
    timestamps: true
});

// Add indexes for query optimization
revenueSchema.index({ property: 1, date: -1 });
revenueSchema.index({ date: -1 });
revenueSchema.index({ source: 1 });
revenueSchema.index({ bookingId: 1 });
revenueSchema.index({ status: 1 });

module.exports = mongoose.model('Revenue', revenueSchema);