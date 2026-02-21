const mongoose = require('mongoose');
require('dotenv').config();

const revertRoomIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        const db = mongoose.connection.db;
        const collection = db.collection('rooms');

        // Drop the old index (roomNumber + property + category)
        try {
            await collection.dropIndex('roomNumber_1_property_1_category_1');
            console.log('✅ Dropped old index: roomNumber_1_property_1_category_1');
        } catch (err) {
            console.log('⚠️ Old index not found or already dropped');
        }

        // Create new index (roomNumber + property only)
        await collection.createIndex(
            { roomNumber: 1, property: 1 },
            { unique: true }
        );
        console.log('✅ Created new index: roomNumber_1_property_1');

        console.log('\n🎉 Index migration completed successfully!');
        console.log('Now same room number cannot exist in same property (even with different categories)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

revertRoomIndex();
