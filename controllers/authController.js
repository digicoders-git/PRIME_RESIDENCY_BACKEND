const User = require('../models/User');
const Manager = require('../models/Manager');
const jwt = require('jsonwebtoken');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        const emailLower = email.toLowerCase();

        // Check for user in both collections
        let user = await User.findOne({ email: emailLower }).select('+password');
        let role = 'Admin';

        if (!user) {
            user = await Manager.findOne({ email: emailLower }).select('+password');
            role = 'Manager';
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches (both models have matchPassword method)
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Pass role explicitly to sendTokenResponse
        user.role = role;
        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// Get token from model, create cookie and send response
function sendTokenResponse(user, statusCode, res) {
    // Determine role
    const role = user.role || 'Admin';

    // Create token
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: role,
            property: user.property, // Include property if available (for managers)
            permissions: user.permissions // Include permissions if available (for managers)
        }
    });
}

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // console.log('Forgot password request for:', email);

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email' });
        }

        const emailLower = email.toLowerCase();

        // Check both User and Manager models
        let user = await User.findOne({ email: emailLower });

        if (!user) {
            user = await Manager.findOne({ email: emailLower });
        }

        // console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate reset token (simple random string for now)
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save({ validateBeforeSave: false });

        // In a real app, send email here. For now, return token directly
        res.status(200).json({ success: true, data: resetToken, message: 'Reset token generated (check response data)' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const resetToken = req.params.resettoken;

        // Try finding in User collection
        let user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        // If not found in User, try Manager
        if (!user) {
            user = await Manager.findOne({
                resetPasswordToken: resetToken,
                resetPasswordExpire: { $gt: Date.now() }
            });
        }

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        let user;
        if (req.user.role === 'Manager') {
            user = await Manager.findById(req.user._id).select('-password');
        } else {
            user = await User.findById(req.user._id).select('-password');
        }
        res.status(200).json({ success: true, data: { ...user.toObject(), role: req.user.role } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update profile (name, phone, profilePic)
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, profilePic } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (profilePic !== undefined) updateData.profilePic = profilePic;

        let user;
        if (req.user.role === 'Manager') {
            user = await Manager.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true }).select('-password');
        } else {
            user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true }).select('-password');
        }

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, data: { ...user.toObject(), role: req.user.role } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Change password
// @route   PUT /api/auth/changepassword
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        let user;
        if (req.user.role === 'Manager') {
            user = await Manager.findById(req.user._id).select('+password');
        } else {
            user = await User.findById(req.user._id).select('+password');
        }

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Register admin (Requires Admin Secret)
// @route   POST /api/auth/register-admin
// @access  Public (Secret Key Protected)
exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, password, adminSecret } = req.body;

        // Check if adminSecret matches
        const configuredSecret = process.env.ADMIN_SECRET || 'PrimEResidency@2026@AdminSecret';
        if (!adminSecret || adminSecret !== configuredSecret) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Invalid admin secret.' });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
        }

        const emailLower = email.toLowerCase();

        // Check if user already exists
        const userExists = await User.findOne({ email: emailLower });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Admin with this email already exists' });
        }

        // Create the admin user
        const user = await User.create({
            name,
            email: emailLower,
            password
        });

        // Set role explicitly for response
        user.role = 'Admin';
        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

