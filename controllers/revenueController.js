const Revenue = require('../models/Revenue');
const Booking = require('../models/Booking');

// @desc    Get all revenue records
// @route   GET /api/revenue
// @access  Private (Admin)
exports.getRevenue = async (req, res) => {
    try {
        const { startDate, endDate, source } = req.query;
        let filter = {};

        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (source) {
            filter.source = source;
        }

        const revenue = await Revenue.find(filter)
            .populate('bookingId', 'guestName roomNumber')
            .sort({ date: -1 });

        const totalRevenue = await Revenue.aggregate([
            { $match: { ...filter, status: filter.status || 'Received' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            success: true,
            count: revenue.length,
            total: totalRevenue[0]?.total || 0,
            data: revenue
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Create new revenue record
// @route   POST /api/revenue
// @access  Private (Admin)
exports.createRevenue = async (req, res) => {
    try {
        const revenue = await Revenue.create(req.body);
        res.status(201).json({
            success: true,
            data: revenue
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update revenue record
// @route   PUT /api/revenue/:id
// @access  Private (Admin)
exports.updateRevenue = async (req, res) => {
    try {
        const revenue = await Revenue.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!revenue) {
            return res.status(404).json({
                success: false,
                error: 'Revenue record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: revenue
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Delete revenue record
// @route   DELETE /api/revenue/:id
// @access  Private (Admin)
exports.deleteRevenue = async (req, res) => {
    try {
        const revenue = await Revenue.findByIdAndDelete(req.params.id);

        if (!revenue) {
            return res.status(404).json({
                success: false,
                error: 'Revenue record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get revenue analytics
// @route   GET /api/revenue/analytics
// @access  Private (Admin)
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

        // Calculate start of current week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Calculate start of previous week
        const lastWeekStart = new Date(startOfWeek);
        lastWeekStart.setDate(startOfWeek.getDate() - 7);

        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);

        // Booking payment stats aggregation helper
        const getBookingStats = async (startDate, endDate) => {
            return await Booking.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        status: { $ne: 'Cancelled' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        totalPaid: { $sum: '$advance' },
                        totalPending: { $sum: '$balance' },
                        fullyPaidCount: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] }
                        },
                        partialPaidCount: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Partial'] }, 1, 0] }
                        },
                        pendingCount: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] }
                        },
                        totalBookings: { $sum: 1 }
                    }
                }
            ]);
        };

        const [
            dailyRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue,
            lastWeekRevenue, sourceBreakdown, weeklyTrend,
            dailyBookingStats, weeklyBookingStats, monthlyBookingStats, yearlyBookingStats
        ] = await Promise.all([
            Revenue.aggregate([
                { $match: { date: { $gte: startOfDay, $lte: endOfDay }, status: 'Received' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { date: { $gte: startOfWeek, $lte: endOfWeek }, status: 'Received' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'Received' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { date: { $gte: startOfYear, $lte: endOfYear }, status: 'Received' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { date: { $gte: lastWeekStart, $lte: lastWeekEnd }, status: 'Received' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { status: 'Received' } },
                { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } }
            ]),
            Revenue.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(new Date().setDate(new Date().getDate() - 6)),
                            $lte: new Date()
                        },
                        status: 'Received'
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                            source: { $ifNull: ["$bookingSource", "Dashboard"] }
                        },
                        total: { $sum: '$amount' }
                    }
                },
                {
                    $group: {
                        _id: "$_id.date",
                        online: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.source", "Website"] }, "$total", 0]
                            }
                        },
                        offline: {
                            $sum: {
                                $cond: [{ $ne: ["$_id.source", "Website"] }, "$total", 0]
                            }
                        },
                        total: { $sum: "$total" }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            getBookingStats(startOfDay, endOfDay),
            getBookingStats(startOfWeek, endOfWeek),
            getBookingStats(startOfMonth, endOfMonth),
            getBookingStats(startOfYear, endOfYear)
        ]);

        const currentWeek = weeklyRevenue[0]?.total || 0;
        const previousWeek = lastWeekRevenue[0]?.total || 0;
        const weeklyGrowth = previousWeek > 0 ? ((currentWeek - previousWeek) / previousWeek * 100) : 0;

        console.log('Weekly Trend Data:', weeklyTrend); // Debug log

        res.status(200).json({
            success: true,
            data: {
                daily: dailyRevenue[0]?.total || 0,
                weekly: currentWeek,
                monthly: monthlyRevenue[0]?.total || 0,
                yearly: yearlyRevenue[0]?.total || 0,
                weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
                sourceBreakdown,
                weeklyTrend,
                bookingStats: {
                    daily: dailyBookingStats[0] || { totalAmount: 0, totalPaid: 0, totalPending: 0, fullyPaidCount: 0, partialPaidCount: 0, pendingCount: 0, totalBookings: 0 },
                    weekly: weeklyBookingStats[0] || { totalAmount: 0, totalPaid: 0, totalPending: 0, fullyPaidCount: 0, partialPaidCount: 0, pendingCount: 0, totalBookings: 0 },
                    monthly: monthlyBookingStats[0] || { totalAmount: 0, totalPaid: 0, totalPending: 0, fullyPaidCount: 0, partialPaidCount: 0, pendingCount: 0, totalBookings: 0 },
                    yearly: yearlyBookingStats[0] || { totalAmount: 0, totalPaid: 0, totalPending: 0, fullyPaidCount: 0, partialPaidCount: 0, pendingCount: 0, totalBookings: 0 }
                }
            }
        });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};