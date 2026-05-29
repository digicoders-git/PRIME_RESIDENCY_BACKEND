const FoodItem = require('../models/FoodItem');
const FoodCategory = require('../models/FoodCategory');

exports.getFoodItems = async (req, res) => {
    try {
        let query = {};
        
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            query.property = req.user.property;
        } else if (req.query.property && req.query.property !== 'All') {
            query.property = req.query.property;
        }

        // Add pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const items = await FoodItem.find(query)
            .sort({ category: 1, name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const total = await FoodItem.countDocuments(query);

        res.json({ 
            success: true, 
            count: items.length,
            total: total,
            page: page,
            pages: Math.ceil(total / limit),
            data: items 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createFoodItem = async (req, res) => {
    try {
        const itemData = { ...req.body };
        
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            itemData.property = req.user.property;
        }

        const item = await FoodItem.create(itemData);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateFoodItem = async (req, res) => {
    try {
        const item = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteFoodItem = async (req, res) => {
    try {
        const item = await FoodItem.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getFoodCategories = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            query.property = { $in: [req.user.property, 'All'] };
        } else if (req.query.property && req.query.property !== 'All') {
            query.property = { $in: [req.query.property, 'All'] };
        }

        let categories = await FoodCategory.find(query).sort({ name: 1 });

        // Seed defaults if empty
        if (categories.length === 0) {
            const defaults = [
                { name: 'Snacks', property: 'All' },
                { name: 'Beverages', property: 'All' },
                { name: 'Other', property: 'All' }
            ];
            await FoodCategory.insertMany(defaults);
            categories = await FoodCategory.find(query).sort({ name: 1 });
        }

        res.json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createFoodCategory = async (req, res) => {
    try {
        const { name, property } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const categoryData = { name: name.trim() };
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            categoryData.property = req.user.property;
        } else if (property) {
            categoryData.property = property;
        } else {
            categoryData.property = 'All';
        }

        // Check if exists
        const exists = await FoodCategory.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, 
            property: categoryData.property
        });

        if (exists) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        const category = await FoodCategory.create(categoryData);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteFoodCategory = async (req, res) => {
    try {
        const category = await FoodCategory.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateFoodCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const category = await FoodCategory.findByIdAndUpdate(
            req.params.id, 
            { name: name.trim() }, 
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

