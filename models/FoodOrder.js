const mongoose = require('mongoose');

const foodOrderSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    guestName: {
        type: String,
        required: true
    },
    property: {
        type: String,
        enum: ['Prime Residency', 'Prem Kunj'],
        required: true
    },
    items: [{
        foodItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodItem'
        },
        name: String,
        quantity: Number,
        price: Number,
        amount: Number
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Preparing', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FoodOrder', foodOrderSchema);
