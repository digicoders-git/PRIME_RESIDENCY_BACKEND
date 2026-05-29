const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const FoodCategory = require('../models/FoodCategory');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/PrimeResidency';

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

async function addCategories() {
    try {
        console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB!');

        for (const catName of categoriesToAdd) {
            // Check if already exists for "All" property
            const existing = await FoodCategory.findOne({
                name: { $regex: new RegExp(`^${catName}$`, 'i') },
                property: 'All'
            });

            if (!existing) {
                await FoodCategory.create({
                    name: catName,
                    property: 'All'
                });
                console.log(`Successfully added category: ${catName}`);
            } else {
                console.log(`Category already exists: ${catName}`);
            }
        }

        console.log('All categories processed successfully!');
    } catch (error) {
        console.error('Error adding categories:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

addCategories();
