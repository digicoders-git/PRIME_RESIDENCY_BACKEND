const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Manager = require('../models/Manager');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('🔐 Decoded Token:', { id: decoded.id, role: decoded.role, property: decoded.property });

        // Check if it's a manager or admin based on decoded token
        if (decoded.role && decoded.role.toLowerCase() === 'manager') {
            const manager = await Manager.findById(decoded.id);
            if (!manager) {
                return res.status(401).json({ success: false, message: 'Manager not found' });
            }
            
            // Set user object with manager data
            req.user = {
                _id: manager._id,
                name: manager.name,
                email: manager.email,
                role: 'Manager',
                property: manager.property,
                permissions: manager.permissions
            };
            console.log('✅ Manager Authenticated:', { id: req.user._id, property: req.user.property });
        } else {
            const admin = await User.findById(decoded.id);
            if (!admin) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            
            req.user = {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: 'Admin'
            };
            console.log('✅ Admin Authenticated:', { id: req.user._id });
        }

        next();
    } catch (err) {
        console.error('❌ Auth Error:', err.message);
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};
