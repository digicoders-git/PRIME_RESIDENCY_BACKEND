const mongoose = require('mongoose');
require('dotenv').config();

const findDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');

        const db = mongoose.connection.db;
        const collection = db.collection('rooms');

        // Find all rooms
        const rooms = await collection.find({}).toArray();

        // Group by roomNumber + property
        const grouped = {};
        rooms.forEach(room => {
            const key = `${room.roomNumber}_${room.property}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(room);
        });

        // Find duplicates
        console.log('🔍 Duplicate Room Numbers (Same Property, Different Categories):\n');
        let hasDuplicates = false;

        Object.entries(grouped).forEach(([key, roomList]) => {
            if (roomList.length > 1) {
                hasDuplicates = true;
                console.log(`📍 Room Number: ${roomList[0].roomNumber} | Property: ${roomList[0].property}`);
                roomList.forEach(room => {
                    console.log(`   - Category: ${room.category} | Name: ${room.name} | ID: ${room._id}`);
                });
                console.log('');
            }
        });

        if (!hasDuplicates) {
            console.log('✅ No duplicates found! Safe to create unique index.\n');
        } else {
            console.log('⚠️  You need to change room numbers for one of the duplicates before creating unique index.\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

findDuplicates();
