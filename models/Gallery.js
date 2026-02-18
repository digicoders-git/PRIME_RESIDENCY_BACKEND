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

        default: 'Others'
    },
    property: {
        type: String,
        enum: ['Prime Residency', 'Prem Kunj'],
        required: [true, 'Please assign a property']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Gallery', gallerySchema);
