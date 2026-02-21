const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a room name']
    },
    roomNumber: {
        type: String,
        required: [true, 'Please add a room number']
    },
    type: {
        type: String,
        required: [true, 'Please add a room type'],

    },
    category: {
        type: String,
        enum: ['Room', 'Banquet', 'Lawn'],
        default: 'Room'
    },
    property: {
        type: String,
        enum: ['Prime Residency', 'Prem Kunj'],
        default: 'Prime Residency'
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    status: {
        type: String,
        enum: ['Available', 'Booked', 'Maintenance'],
        default: 'Available'
    },
    amenities: [String],
    image: {
        type: String
    },
    description: {
        type: String
    },
    // Extended Details
    roomSize: String,
    bedType: String,
    floorNumber: String,
    maxAdults: Number,
    maxChildren: Number,

    // Pricing Extended
    discount: Number,
    offerPrice: Number,
    extraBedPrice: Number,
    taxGST: Number,
    totalPrice: Number,

    // Charges Configuration
    enableExtraCharges: {
        type: Boolean,
        default: false
    },

    // Inventory
    totalRoomsCount: Number,
    availableRooms: Number,

    // Media Extended
    gallery: [String], // Array of image URLs
    video360: String,
    imageAltText: String,

    // Descriptions
    shortDescription: String,
    specialNotes: String,

    // Policies
    checkInTime: String,
    checkOutTime: String,
    cancellationPolicy: String,
    refundPolicy: String,

    // Booking Rules
    minNightsStay: Number,
    maxNightsStay: Number,

    // Admin
    featured: {
        type: Boolean,
        default: false
    },
    visibility: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index: same room number NOT allowed in same property (across all categories)
roomSchema.index({ roomNumber: 1, property: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
