const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Please enter your phone number']
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    checkIn: {
        type: Date
    },
    checkOut: {
        type: Date
    },
    guests: {
        type: String
    },
    roomType: {
        type: String
    },
    message: {
        type: String
    },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Booked', 'Cancelled'],
        default: 'New'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Enquiry', enquirySchema);
