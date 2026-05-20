const FoodItem = require('../models/FoodItem');

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
