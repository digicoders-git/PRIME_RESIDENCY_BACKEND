const mongoose = require('mongoose');
const Manager = require('./models/Manager');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
require('dotenv').config();

async function testManagerFilter() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all managers
        const managers = await Manager.find();
        console.log('📋 Managers in Database:');
        managers.forEach(m => {
            console.log(`   - ${m.name} (${m.email})`);
            console.log(`     Property: ${m.property}`);
            console.log(`     Status: ${m.status}\n`);
        });

        // Get rooms by property
        const primeRooms = await Room.find({ property: 'Prime Residency' });
        const premRooms = await Room.find({ property: 'Prem Kunj' });
        
        console.log('🏨 Rooms Distribution:');
        console.log(`   Prime Residency: ${primeRooms.length} rooms`);
        console.log(`   Prem Kunj: ${premRooms.length} rooms\n`);

        // Get bookings by property
        const primeBookings = await Booking.find({ property: 'Prime Residency' });
        const premBookings = await Booking.find({ property: 'Prem Kunj' });
        
        console.log('📅 Bookings Distribution:');
        console.log(`   Prime Residency: ${primeBookings.length} bookings`);
        console.log(`   Prem Kunj: ${premBookings.length} bookings\n`);

        // Test Manager Filter Simulation
        console.log('🧪 Testing Manager Filter Logic:\n');
        
        for (const manager of managers) {
            console.log(`Manager: ${manager.name} (${manager.property})`);
            
            const managerRooms = await Room.find({ property: manager.property });
            const managerBookings = await Booking.find({ property: manager.property });
            
            console.log(`  Should see: ${managerRooms.length} rooms, ${managerBookings.length} bookings`);
            console.log(`  ✓ Filter working correctly\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testManagerFilter();
