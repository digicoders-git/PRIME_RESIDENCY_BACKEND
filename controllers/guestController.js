const Guest = require('../models/Guest');

// @desc    Get all guests
// @route   GET /api/guests
// @access  Private/Admin
exports.getGuests = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            query.property = req.user.property;
        } else if (req.query.property) {
            query.property = req.query.property;
        }

        const guests = await Guest.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: guests.length, data: guests });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single guest
// @route   GET /api/guests/:id
// @access  Private/Admin
exports.getGuest = async (req, res) => {
    try {
        const guest = await Guest.findById(req.params.id);
        if (!guest) {
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }
        res.status(200).json({ success: true, data: guest });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update guest
// @route   PUT /api/guests/:id
// @access  Private/Admin
exports.updateGuest = async (req, res) => {
    try {
        const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!guest) {
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        res.status(200).json({ success: true, data: guest });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
