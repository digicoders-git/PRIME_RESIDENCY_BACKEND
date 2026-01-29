const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    imageUrl: {
        type: String,
        required: [true, 'Please add an image URL']
    },
    publicId: {
        type: String,
        required: [true, 'Please add Cloudinary public ID']
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['Rooms', 'Restaurant', 'Exterior', 'Events', 'Others'],
        default: 'Others'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Gallery', gallerySchema);
