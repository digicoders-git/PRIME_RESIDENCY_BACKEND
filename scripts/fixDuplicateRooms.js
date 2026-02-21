const mongoose = require('mongoose');
require('dotenv').config();

const fixDuplicates = async () => {
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

        // Fix duplicates
        console.log('🔧 Fixing Duplicate Room Numbers...\n');
        let fixedCount = 0;

        for (const [key, roomList] of Object.entries(grouped)) {
            if (roomList.length > 1) {
                // Keep Room category as is, change Banquet/Lawn
                const roomCategory = roomList.find(r => r.category === 'Room');
                const others = roomList.filter(r => r.category !== 'Room');

                for (const room of others) {
                    let newRoomNumber;
                    if (room.category === 'Banquet') {
                        newRoomNumber = `B${room.roomNumber}`;
                    } else if (room.category === 'Lawn') {
                        newRoomNumber = `L${room.roomNumber}`;
                    }

                    await collection.updateOne(
                        { _id: room._id },
                        { $set: { roomNumber: newRoomNumber } }
                    );

                    console.log(`✅ Changed ${room.category} ${room.roomNumber} → ${newRoomNumber} (${room.property})`);
                    fixedCount++;
                }
            }
        }

        if (fixedCount === 0) {
            console.log('✅ No duplicates found!\n');
        } else {
            console.log(`\n🎉 Fixed ${fixedCount} duplicate room numbers!`);
            console.log('Now you can run the migration script to create unique index.\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixDuplicates();
