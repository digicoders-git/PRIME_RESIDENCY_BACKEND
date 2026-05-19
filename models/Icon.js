const mongoose = require('mongoose');

const iconSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    iconName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['basic', 'bathroom', 'furniture', 'kitchen', 'entertainment', 'services', 'facilities', 'security', 'safety', 'accessibility', 'policies', 'room-type'],
        default: 'basic'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Icon', iconSchema);
