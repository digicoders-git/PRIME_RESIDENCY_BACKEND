const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://digicodersdevelopment_db_user:LsgpfZhoMejwO9Qd@cluster0.le63hap.mongodb.net/ERP?appName=Cluster0';

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('Connected successfully!');

        const Room = require('./models/Room');

        console.log('\n--- 1. Querying all rooms with roomNumber: "101" ---');
        const rooms = await Room.find({ roomNumber: '101' });
        console.log(`Found ${rooms.length} room(s) with roomNumber "101":`);
        rooms.forEach((r, idx) => {
            console.log(`[Room ${idx + 1}] ID: ${r._id}, Name: ${r.name}, Property: ${r.property}, Category: ${r.category}, Status: ${r.status}`);
        });

        console.log('\n--- 2. Fetching all indexes on "rooms" collection ---');
        const indexes = await Room.collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        console.log('\n--- 3. Total room count in database ---');
        const totalCount = await Room.countDocuments();
        console.log('Total rooms:', totalCount);

        process.exit(0);
    } catch (err) {
        console.error('Error running check:', err);
        process.exit(1);
    }
}

run();
