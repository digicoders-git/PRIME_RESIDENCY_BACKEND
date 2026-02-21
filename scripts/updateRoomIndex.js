const mongoose = require('mongoose');
require('dotenv').config();

const updateRoomIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('rooms');

        // Drop old index
        try {
            await collection.dropIndex('roomNumber_1_property_1');
            console.log('✅ Old index dropped: roomNumber_1_property_1');
        } catch (error) {
            console.log('⚠️ Old index not found or already dropped');
        }

        // Create new index with category
        await collection.createIndex(
            { roomNumber: 1, property: 1, category: 1 },
            { unique: true }
        );
        console.log('✅ New index created: roomNumber_1_property_1_category_1');

        console.log('\n✅ Index migration completed successfully!');
        console.log('Now Room 101, Banquet 101, and Lawn 101 can coexist in the same property.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

updateRoomIndex();
