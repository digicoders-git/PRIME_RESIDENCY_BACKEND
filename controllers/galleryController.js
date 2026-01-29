const Gallery = require('../models/Gallery');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { saveImageBackup } = require('../utils/imageBackup');

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
exports.getGallery = async (req, res) => {
    try {
        const images = await Gallery.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: images.length, data: images });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Upload gallery image
// @route   POST /api/gallery
// @access  Private/Admin
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }

        const category = req.body.category || 'Others';
        const folderName = `gallery/${category.toLowerCase()}`;
        
        const result = await uploadToCloudinary(req.file.buffer, folderName);

        // Save local backup
        const timestamp = Date.now();
        const filename = `${timestamp}_${req.file.originalname}`;
        const backupCategory = `images/gallery`;
        saveImageBackup(req.file.buffer, filename, backupCategory);

        const image = await Gallery.create({
            title: req.body.title || 'Untitled',
            imageUrl: result.secure_url,
            publicId: result.public_id,
            category: category
        });

        res.status(201).json({ success: true, data: image });
    } catch (err) {
        console.error('Gallery upload error:', err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete gallery image
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
exports.deleteImage = async (req, res) => {
    try {
        const image = await Gallery.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        // Delete from Cloudinary
        await deleteFromCloudinary(image.publicId);

        // Delete from DB
        await image.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
