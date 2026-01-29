const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Guest', guestSchema);
