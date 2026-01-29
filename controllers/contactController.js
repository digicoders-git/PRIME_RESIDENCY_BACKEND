const Contact = require('../models/Contact');

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private/Admin
exports.getContacts = async (req, res) => {
    try {
        const { status, priority } = req.query;
        let filter = {};

        if (status) {
            filter.status = status;
        }
        if (priority) {
            filter.priority = priority;
        }

        const contacts = await Contact.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: contacts.length, data: contacts });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Private/Admin
exports.getContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }
        res.status(200).json({ success: true, data: contact });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create contact
// @route   POST /api/contacts
// @access  Public
exports.createContact = async (req, res) => {
    try {
        const contact = await Contact.create(req.body);
        res.status(201).json({ success: true, data: contact });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private/Admin
exports.updateContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        res.status(200).json({ success: true, data: contact });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private/Admin
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        await contact.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update contact status
// @route   PUT /api/contacts/:id/status
// @access  Private/Admin
exports.updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        res.status(200).json({ success: true, data: contact });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
