const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Load models
const Room = require('../models/Room');
const User = require('../models/User');
const Service = require('../models/Service');

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Sample Data
const rooms = [
    {
        name: 'Classic Room',
        roomNumber: '201',
        type: 'Classic',
        price: 3500,
        amenities: ['WiFi', 'TV', 'Air Conditioning'],
        status: 'Available'
    },
    {
        name: 'Deluxe Suite',
        roomNumber: 'A-501',
        type: 'Deluxe',
        price: 6500,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
        status: 'Available'
    }
];

const services = [
    {
        title: 'Spa & Wellness Center',
        subtitle: 'Unwind & Rejuvenate',
        description: 'Experience holistic wellness with our range of massages and therapies led by expert practitioners.',
        image: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?q=60&w=1200&auto=format&fit=crop',
        features: ['Professional Therapists', 'Private Treatment Rooms', 'Sauna & Steam Bath'],
        category: 'main',
        order: 1
    },
    {
        title: 'High-Speed Wi-Fi',
        subtitle: 'Stay Connected',
        description: 'Available throughout the hotel',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=60&w=1200&auto=format&fit=crop',
        features: ['24/7 Access', 'High Speed', 'Secure Connection'],
        category: 'facility',
        icon: 'FaWifi',
        order: 1
    }
];

const users = [
    {
        name: 'Admin User',
        email: 'admin@prime.com',
        password: 'admin123',
        role: 'admin'
    }
];

// Import into DB
const importData = async () => {
    try {
        await Room.create(rooms);
        await User.create(users);
        await Service.create(services);
        console.log('Data Imported...');
        process.exit();
    } catch (err) {
        console.error(err);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await Room.deleteMany();
        await User.deleteMany();
        await Service.deleteMany();
        console.log('Data Destroyed...');
        process.exit();
    } catch (err) {
        console.error(err);
    }
};

if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
}
