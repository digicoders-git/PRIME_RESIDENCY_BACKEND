const RoomConfig = require('../models/RoomConfig');

// Get all configs by type
const getConfigsByType = async (req, res) => {
    try {
        const { type } = req.params;
        const configs = await RoomConfig.find({ type, isActive: true }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: configs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching configs',
            error: error.message
        });
    }
};

// Get all configs
const getAllConfigs = async (req, res) => {
    try {
        const configs = await RoomConfig.find({ isActive: true }).sort({ type: 1, createdAt: -1 });
        
        res.json({
            success: true,
            data: configs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching configs',
            error: error.message
        });
    }
};

// Create new config
const createConfig = async (req, res) => {
    try {
        const { type, name, icon } = req.body;
        
        const config = new RoomConfig({
            type,
            name,
            icon
        });
        
        await config.save();
        
        res.status(201).json({
            success: true,
            message: 'Config created successfully',
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating config',
            error: error.message
        });
    }
};

// Delete config
const deleteConfig = async (req, res) => {
    try {
        await RoomConfig.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Config deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting config',
            error: error.message
        });
    }
};

module.exports = {
    getConfigsByType,
    getAllConfigs,
    createConfig,
    deleteConfig
};
