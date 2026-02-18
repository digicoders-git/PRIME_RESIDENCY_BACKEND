const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    address: {
        type: String
    },
    lastBooking: {
        type: Date
    },
    totalStay: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Regular', 'VIP', 'Blacklisted', 'New'],
        default: 'New'
    },
    property: {
        type: String,
        enum: ['Prime Residency', 'Prem Kunj'],
        required: [true, 'Please assign a property']
    }
}, {
    timestamps: true
});

// Compound index to allow same guest in different properties
guestSchema.index({ email: 1, property: 1 }, { unique: true });

module.exports = mongoose.model('Guest', guestSchema);
