const mongoose = require('mongoose');

const foodCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    property: {
        type: String,
        required: true,
        enum: ['Prime Residency', 'Prem Kunj', 'All'],
        default: 'All'
    }
}, {
    timestamps: true
});

// Avoid duplicate category names per property
foodCategorySchema.index({ name: 1, property: 1 }, { unique: true });

module.exports = mongoose.model('FoodCategory', foodCategorySchema);
