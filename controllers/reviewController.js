const Review = require('../models/Review');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { saveImageBackup } = require('../utils/imageBackup');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res) => {
    try {
        const { approved, published } = req.query;
        let filter = {};

        if (approved !== undefined) {
            filter.isApproved = approved === 'true';
        }
        if (published !== undefined) {
            filter.isPublished = published === 'true';
        }

        // Property-based filtering
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            filter.property = req.user.property;
        } else if (req.query.property) {
            filter.property = req.query.property;
        }

        // For public frontend, show all approved reviews (not just latest)
        const sortOrder = (approved === 'true' && published === 'true') ? { createdAt: 1 } : { createdAt: -1 };

        const reviews = await Review.find(filter).sort(sortOrder);
        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        res.status(200).json({ success: true, data: review });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Public
exports.createReview = async (req, res) => {
    try {
        let reviewData = { ...req.body };

        // Handle image upload if present
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'reviews');
            reviewData.customerImage = result.secure_url;

            // Save local backup
            const timestamp = Date.now();
            const filename = `${timestamp}_${req.file.originalname}`;
            saveImageBackup(req.file.buffer, filename, 'images/reviews');
        }
        if (req.user && req.user.property) {
            reviewData.property = req.user.property;
        } else if (!reviewData.property) {
            // Default to Prime Residency if not specified
            reviewData.property = 'Prime Residency';
        }

        const review = await Review.create(reviewData);
        res.status(201).json({ success: true, data: review });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private/Admin
exports.updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Property-based check for Managers
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            if (review.property !== req.user.property) {
                return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
            }
        }

        const updatedReview = await Review.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: review });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Property-based check for Managers
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            if (review.property !== req.user.property) {
                return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
            }
        }

        await review.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Approve review
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
exports.approveReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        // Property-based check for Managers
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            if (review.property !== req.user.property) {
                return res.status(403).json({ success: false, message: 'Not authorized to approve this review' });
            }
        }

        review.isApproved = true;
        review.isPublished = true;
        await review.save();

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.status(200).json({ success: true, data: review });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
