const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const FoodCategory = require('../models/FoodCategory');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const localURI = 'mongodb://localhost:27017/PrimeResidency';
const atlasURI = 'mongodb+srv://digicodersdevelopment_db_user:LsgpfZhoMejwO9Qd@cluster0.le63hap.mongodb.net/PrimEResidency?appName=Cluster0';

const categoriesToAdd = [
    'Beverage',
    'Starters',
    'Chinese',
    'Soup',
    'Vegetarian',
    'Non vegetarian',
    'Dal',
    'Bread',
    'Rice',
    'Salad/Raita',
    'Sweets/Desserts'
];

async function seedDB(connectionString, dbName) {
    try {
        console.log(`\n--- Connecting to ${dbName} DB ---`);
        await mongoose.connect(connectionString);
        console.log(`Connected to ${dbName}!`);

        for (const catName of categoriesToAdd) {
            const existing = await FoodCategory.findOne({
                name: { $regex: new RegExp(`^${catName}$`, 'i') },
                property: 'All'
            });

            if (!existing) {
                await FoodCategory.create({
                    name: catName,
                    property: 'All'
                });
                console.log(`[${dbName}] Added category: ${catName}`);
            } else {
                console.log(`[${dbName}] Category already exists: ${catName}`);
            }
        }
        console.log(`[${dbName}] Seeding complete!`);
    } catch (error) {
        console.error(`[${dbName}] Error:`, error.message);
    } finally {
        await mongoose.disconnect();
        console.log(`Disconnected from ${dbName}.`);
    }
}

async function run() {
    // Seed local DB
    await seedDB(localURI, 'Local');
    
    // Seed Atlas DB
    await seedDB(atlasURI, 'Atlas (Cloud)');
}

run();
