const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Other'],
        default: 'Other'
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        default: 'piece'
    },
    property: {
        type: String,
        enum: ['Prime Residency', 'Prem Kunj'],
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    description: String
}, {
    timestamps: true
});

module.exports = mongoose.model('FoodItem', foodItemSchema);
