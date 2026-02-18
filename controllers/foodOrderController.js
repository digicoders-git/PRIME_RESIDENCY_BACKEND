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

        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const foodItem = await FoodItem.findById(item.foodItemId);
            if (!foodItem) continue;
            
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
            totalAmount
        });

        // Add to booking foodOrders array
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

        const orders = await FoodOrder.find(query)
            .populate('bookingId', 'guest phone email')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, data: orders });
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
