const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const managerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add manager name']
    },
    email: {
        type: String,
        required: [true, 'Please add email'],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please add password'],
        minlength: 6,
        select: false
    },
    phone: {
        type: String,
        required: [true, 'Please add phone number']
    },
    property: {
        type: String,
        enum: ['Prime Residency', 'Prem Kunj'],
        required: [true, 'Please assign a property']
    },
    role: {
        type: String,
        default: 'Manager'
    },
    permissions: {
        checkInOut: { type: Boolean, default: false },
        viewBookings: { type: Boolean, default: false },
        viewRooms: { type: Boolean, default: false },
        billing: { type: Boolean, default: false },
        viewHistory: { type: Boolean, default: false }
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    address: String,
    emergencyContact: String,
    salary: Number,
    notes: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Hash password before saving
// Hash password before saving
// Hash password before saving
managerSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

// Match manager entered password to hashed password in database
managerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Manager', managerSchema);
