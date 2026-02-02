const Revenue = require('../models/Revenue');

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
            { $match: filter },
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
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastWeekStart = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastWeekEnd = new Date(startOfWeek.getTime() - 1);

        const [dailyRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue, lastWeekRevenue, sourceBreakdown, weeklyTrend] = await Promise.all([
            Revenue.aggregate([
                { $match: { date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { date: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { date: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { date: { $gte: startOfYear } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $match: { date: { $gte: lastWeekStart, $lte: lastWeekEnd } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Revenue.aggregate([
                { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } }
            ]),
            Revenue.aggregate([
                { 
                    $match: { 
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
            ])
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
                weeklyTrend
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