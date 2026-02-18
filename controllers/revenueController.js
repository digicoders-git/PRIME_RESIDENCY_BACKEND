const Revenue = require('../models/Revenue');
const Booking = require('../models/Booking');

// @desc    Get all revenue records
// @route   GET /api/revenue
// @access  Private (Admin/Manager)
exports.getRevenue = async (req, res) => {
    try {
        const { startDate, endDate, source } = req.query;
        let filter = {};

        // Property filtering
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            filter.property = req.user.property;
        } else if (req.query.property) {
            filter.property = req.query.property;
        }

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
// @access  Private (Admin/Manager)
exports.createRevenue = async (req, res) => {
    try {
        const revenueData = { ...req.body };

        // If manager is creating, enforce their property
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            revenueData.property = req.user.property;
        }

        const revenue = await Revenue.create(revenueData);
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
            let bookingFilter = {
                createdAt: { $gte: startDate, $lte: endDate },
                status: { $ne: 'Cancelled' }
            };

            if (req.user && req.user.role === 'Manager' && req.user.property) {
                bookingFilter.property = req.user.property;
            } else if (req.query.property) {
                bookingFilter.property = req.query.property;
            }

            return await Booking.aggregate([
                { $match: bookingFilter },
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

        const revenueFilter = { status: 'Received' };
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            revenueFilter.property = req.user.property;
        } else if (req.query.property) {
            revenueFilter.property = req.query.property;
        }

        const [
            dailyRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue,
            lastWeekRevenue, sourceBreakdown, weeklyTrend,
            dailyBookingStats, weeklyBookingStats, monthlyBookingStats, yearlyBookingStats
        ] = await Promise.all([
            Revenue.aggregate([
                { $match: { ...revenueFilter, date: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { ...revenueFilter, date: { $gte: startOfWeek, $lte: endOfWeek } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { ...revenueFilter, date: { $gte: startOfMonth, $lte: endOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { ...revenueFilter, date: { $gte: startOfYear, $lte: endOfYear } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { ...revenueFilter, date: { $gte: lastWeekStart, $lte: lastWeekEnd } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: revenueFilter },
                { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } }
            ]),
            Revenue.aggregate([
                {
                    $match: {
                        ...revenueFilter,
                        date: {
                            $gte: new Date(new Date().setDate(new Date().getDate() - 6)),
                            $lte: new Date()
                        }
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