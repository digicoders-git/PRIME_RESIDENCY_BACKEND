const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const adminExists = await User.findOne({ email: 'admin@prime.com' });
        
        if (adminExists) {
            console.log('Admin already exists!');
            console.log('Email: admin@prime.com');
            console.log('Password: admin123');
            process.exit();
        }

        const admin = await User.create({
            name: 'Admin',
            email: 'admin@prime.com',
            password: 'admin123'
        });

        console.log('✅ Admin created successfully!');
        console.log('Email: admin@prime.com');
        console.log('Password: admin123');
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

createAdmin();
