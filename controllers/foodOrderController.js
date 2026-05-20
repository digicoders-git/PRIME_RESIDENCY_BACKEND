const FoodOrder = require('../models/FoodOrder');
const FoodItem = require('../models/FoodItem');
const Booking = require('../models/Booking');

exports.createFoodOrder = async (req, res) => {
    try {
        const { bookingId, items } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Validate stock for all items first
        for (const item of items) {
            const foodItem = await FoodItem.findById(item.foodItemId);
            if (!foodItem) {
                return res.status(404).json({ success: false, message: `Food item not found: ${item.foodItemId}` });
            }
            if (foodItem.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${foodItem.name}. Available: ${foodItem.stock}, Requested: ${item.quantity}`
                });
            }
        }

        let totalAmount = 0;
        const orderItems = [];

        // If validation passes, process the order
        for (const item of items) {
            const foodItem = await FoodItem.findById(item.foodItemId);
            // We already checked existence and stock, but good to be safe if concurrent requests happen (though unlikely to be an issue in this context without transactions)

            const amount = foodItem.price * item.quantity;
            totalAmount += amount;

            orderItems.push({
                foodItemId: item.foodItemId,
                name: foodItem.name,
                quantity: item.quantity,
                price: foodItem.price,
                amount
            });

            // Reduce stock
            foodItem.stock -= item.quantity;
            await foodItem.save();
        }

        const order = await FoodOrder.create({
            bookingId,
            roomNumber: booking.roomNumber,
            guestName: booking.guest,
            property: booking.property,
            items: orderItems,
            totalAmount,
            status: req.body.status || 'Pending'
        });

        // Add to booking foodOrders array
        // Check if booking.foodOrders is initialized
        if (!booking.foodOrders) {
            booking.foodOrders = [];
        }

        for (const item of orderItems) {
            booking.foodOrders.push({
                item: item.name,
                quantity: item.quantity,
                price: item.price,
                amount: item.amount,
                date: new Date()
            });
        }
        await booking.save();

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getFoodOrders = async (req, res) => {
    try {
        let query = {};

        if (req.user && req.user.role === 'Manager' && req.user.property) {
            query.property = req.user.property;
        } else if (req.query.property && req.query.property !== 'All') {
            query.property = req.query.property;
        }

        // Add pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const orders = await FoodOrder.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await FoodOrder.countDocuments(query);

        res.json({ 
            success: true,
            count: orders.length,
            total: total,
            page: page,
            pages: Math.ceil(total / limit),
            data: orders 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await FoodOrder.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const order = await FoodOrder.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, message: 'Order deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
