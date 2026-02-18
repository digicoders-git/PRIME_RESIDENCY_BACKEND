const Manager = require('../models/Manager');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Manager login
// @route   POST /api/managers/login
// @access  Public
exports.managerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if manager exists
        const manager = await Manager.findOne({ email }).select('+password');
        if (!manager) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if manager is active
        if (manager.status !== 'Active') {
            return res.status(401).json({ success: false, message: 'Account is inactive' });
        }

        // Check password
        const isMatch = await manager.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: manager._id, role: 'manager', property: manager.property },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        // Remove password from response
        const managerData = manager.toObject();
        delete managerData.password;

        res.status(200).json({
            success: true,
            token,
            data: managerData
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all managers
// @route   GET /api/managers
// @access  Private/Admin
exports.getManagers = async (req, res) => {
    try {
        const managers = await Manager.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: managers.length,
            data: managers
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single manager
// @route   GET /api/managers/:id
// @access  Private/Admin
exports.getManager = async (req, res) => {
    try {
        const manager = await Manager.findById(req.params.id);
        if (!manager) {
            return res.status(404).json({ success: false, message: 'Manager not found' });
        }
        res.status(200).json({ success: true, data: manager });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create new manager
// @route   POST /api/managers
// @access  Private/Admin
exports.createManager = async (req, res) => {
    try {
        console.log('Create Manager Requested:', req.body);

        // Basic cleanup for optional empty strings that should be null/undefined for Mongoose
        if (req.body.salary === '' || req.body.salary === null) delete req.body.salary;
        if (req.body.notes === '' || req.body.notes === null) delete req.body.notes;

        const manager = await Manager.create(req.body);
        res.status(201).json({ success: true, data: manager });
    } catch (err) {
        console.error('Create Manager Error:', err);
        if (err.code === 11000 && err.keyPattern?.email) {
            return res.status(400).json({ success: false, message: `Email ${err.keyValue.email} already exists` });
        }

        // Return clear validation messages
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message).join(', ');
            return res.status(400).json({ success: false, message });
        }

        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update manager
// @route   PUT /api/managers/:id
// @access  Private/Admin
exports.updateManager = async (req, res) => {
    try {
        console.log('Update Manager Requested:', req.params.id, req.body);

        let manager = await Manager.findById(req.params.id);

        if (!manager) {
            return res.status(404).json({ success: false, message: 'Manager not found' });
        }

        // Cleanup optional number fields
        if (req.body.salary === '' || req.body.salary === null) delete req.body.salary;

        // Update fields
        const fieldsToUpdate = ['name', 'email', 'phone', 'property', 'status', 'permissions', 'address', 'emergencyContact', 'salary', 'notes'];

        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                manager[field] = req.body[field];
            }
        });

        // Update password only if provided
        if (req.body.password && req.body.password.trim() !== '') {
            manager.password = req.body.password;
        }

        await manager.save();

        res.status(200).json({ success: true, data: manager });
    } catch (err) {
        console.error('Update Manager Error:', err);
        if (err.code === 11000 && err.keyPattern?.email) {
            return res.status(400).json({ success: false, message: `Email ${err.keyValue.email} already exists` });
        }

        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message).join(', ');
            return res.status(400).json({ success: false, message });
        }

        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete manager
// @route   DELETE /api/managers/:id
// @access  Private/Admin
exports.deleteManager = async (req, res) => {
    try {
        const manager = await Manager.findByIdAndDelete(req.params.id);

        if (!manager) {
            return res.status(404).json({ success: false, message: 'Manager not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
