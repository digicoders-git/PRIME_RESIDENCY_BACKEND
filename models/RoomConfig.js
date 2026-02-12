const mongoose = require('mongoose');

const roomConfigSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RoomConfig', roomConfigSchema);
