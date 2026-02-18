const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    features: [{
        type: String,
        required: true
    }],
    category: {
        type: String,
        enum: ['main', 'facility'],
        default: 'main'
    },
    icon: {
        type: String // For facility services
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    property: {
        type: String,
        enum: ['Prime Residency', 'Prem Kunj'],
        required: [true, 'Please assign a property']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);