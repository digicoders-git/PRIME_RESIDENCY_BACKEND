const dns = require('dns');
// Set DNS to Google's public DNS to bypass querySrv ECONNREFUSED issue on local network
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://digicodersdevelopment_db_user:LsgpfZhoMejwO9Qd@cluster0.le63hap.mongodb.net/PrimEResidency?appName=Cluster0';

async function run() {
    try {
        console.log(`Connecting to MongoDB Atlas (using Google DNS 8.8.8.8)...`);
        console.log(`URI: ${mongoURI.replace(/:([^@]+)@/, ':****@')}`); // log URI with hidden password
        await mongoose.connect(mongoURI);
        console.log('Connected successfully!');

        const db = mongoose.connection.db;
        const roomsCollection = db.collection('rooms');

        console.log('\n--- 1. Fetching current indexes on "rooms" ---');
        let indexes = await roomsCollection.indexes();
        console.log('Current Indexes in Database:');
        indexes.forEach(idx => {
            console.log(` - Name: "${idx.name}", Keys:`, idx.key, `, Unique: ${!!idx.unique}, Hidden: ${!!idx.hidden}`);
        });

        // 1. Drop "roomNumber_1" index if exists
        const oldSingleIndex = indexes.find(idx => idx.name === 'roomNumber_1');
        if (oldSingleIndex) {
            console.log(`\nFound stale single-field unique index: "${oldSingleIndex.name}". Dropping it...`);
            await roomsCollection.dropIndex(oldSingleIndex.name);
            console.log(`✅ Successfully dropped "${oldSingleIndex.name}"!`);
        }

        // 2. Drop "roomNumber_1_property_1" index if exists (stale, hidden unique index)
        const staleCompoundIndex = indexes.find(idx => idx.name === 'roomNumber_1_property_1');
        if (staleCompoundIndex) {
            console.log(`\nFound stale unique index: "${staleCompoundIndex.name}" (which is unique and hidden, blocking room creation!). Dropping it...`);
            await roomsCollection.dropIndex(staleCompoundIndex.name);
            console.log(`✅ Successfully dropped stale index "${staleCompoundIndex.name}"!`);
        }

        console.log('\n--- 2. Re-fetching indexes to verify ---');
        indexes = await roomsCollection.indexes();
        console.log('Updated Indexes:');
        indexes.forEach(idx => {
            console.log(` - Name: "${idx.name}", Keys:`, idx.key, `, Unique: ${!!idx.unique}, Hidden: ${!!idx.hidden}`);
        });

        console.log('\n--- 3. Querying rooms with roomNumber "101" ---');
        const rooms = await roomsCollection.find({ roomNumber: '101' }).toArray();
        console.log(`Found ${rooms.length} room(s) in database with number "101":`);
        rooms.forEach((r, idx) => {
            console.log(` [Room ${idx + 1}] ID: ${r._id}, Name: ${r.name}, Property: ${r.property}, Category: ${r.category}`);
        });

        console.log('\n🎉 Index cleanup complete! Try adding Room 101 again.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during index cleanup:', err.message);
        process.exit(1);
    }
}

run();
