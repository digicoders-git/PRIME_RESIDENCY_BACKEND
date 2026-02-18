const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    guest: {
        type: String,
        required: [true, 'Please add a guest name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    idType: {
        type: String
    },
    idNumber: {
        type: String
    },
    idFrontImage: {
        type: String
    },
    idBackImage: {
        type: String
    },
    checkIn: {
        type: Date,
        required: [true, 'Please add a check-in date']
    },
    checkOut: {
        type: Date,
        required: [true, 'Please add a check-out date']
    },
    adults: {
        type: Number,
        default: 1
    },
    children: {
        type: Number,
        default: 0
    },
    room: {
        type: String,
        required: [true, 'Please add a room name']
    },
    roomNumber: {
        type: String,
        required: [true, 'Please add a room number']
    },
    amount: {
        type: Number,
        required: [true, 'Please add total amount']
    },
    advance: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    extraBedPrice: {
        type: Number,
        default: 0
    },
    taxGST: {
        type: Number,
        default: 0
    },
    nights: {
        type: Number,
        required: true
    },
    specialRequests: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Partial', 'Paid', 'Cancelled'],
        default: 'Pending'
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'],
        default: 'Pending'
    },
    source: {
        type: String,
        default: 'Dashboard'
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    extraBed: {
        type: Boolean,
        default: false
    },
    foodOrders: [{
        item: String,
        quantity: { type: Number, default: 1 },
        price: Number,
        amount: Number,
        date: { type: Date, default: Date.now }
    }],
    extraCharges: [{
        description: String,
        amount: Number,
        date: { type: Date, default: Date.now }
    }],
    property: {
        type: String,
        required: [true, 'Please assign a property'],
        enum: ['Prime Residency', 'Prem Kunj']
    },
    bookingDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate total amount and balance before saving
bookingSchema.pre('save', async function () {
    const foodTotal = this.foodOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const extraChargesTotal = this.extraCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);

    if (this.amount > 0) {
        this.balance = this.amount + foodTotal + extraChargesTotal - this.advance;
    }

    // Update payment status based on balance
    if (this.balance <= 0 && this.amount > 0) {
        this.paymentStatus = 'Paid';
    } else if (this.advance > 0 && this.balance > 0) {
        this.paymentStatus = 'Partial';
    } else if (this.status !== 'Cancelled') {
        this.paymentStatus = 'Pending';
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
