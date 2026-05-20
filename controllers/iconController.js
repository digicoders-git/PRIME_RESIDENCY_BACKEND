const Icon = require('../models/Icon');

// Get all icons
const getAllIcons = async (req, res) => {
    try {
        const icons = await Icon.find({ isActive: true })
            .sort({ category: 1, name: 1 })
            .lean();
        res.json({
            success: true,
            data: icons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching icons',
            error: error.message
        });
    }
};

// Get icons by category
const getIconsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const icons = await Icon.find({ category, isActive: true })
            .sort({ name: 1 })
            .lean();
        res.json({
            success: true,
            data: icons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching icons',
            error: error.message
        });
    }
};

// Create new icon
const createIcon = async (req, res) => {
    try {
        const { name, iconName, category } = req.body;

        if (!name || !iconName) {
            return res.status(400).json({
                success: false,
                message: 'Name and iconName are required'
            });
        }

        // Check if icon already exists
        const existingIcon = await Icon.findOne({ name });
        if (existingIcon) {
            return res.status(400).json({
                success: false,
                message: 'Icon with this name already exists'
            });
        }

        const icon = new Icon({
            name,
            iconName,
            category: category || 'basic'
        });

        await icon.save();

        res.status(201).json({
            success: true,
            message: 'Icon created successfully',
            data: icon
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating icon',
            error: error.message
        });
    }
};

// Delete icon
const deleteIcon = async (req, res) => {
    try {
        const { id } = req.params;
        await Icon.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Icon deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting icon',
            error: error.message
        });
    }
};

module.exports = {
    getAllIcons,
    getIconsByCategory,
    createIcon,
    deleteIcon
};
