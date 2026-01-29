const Room = require('../models/Room');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { saveImageBackup } = require('../utils/imageBackup');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find();
        res.status(200).json({ success: true, count: rooms.length, data: rooms });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single room by room number
// @route   GET /api/rooms/by-number/:roomNumber
// @access  Public
exports.getRoomByNumber = async (req, res) => {
    try {
        const room = await Room.findOne({ roomNumber: req.params.roomNumber });
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        res.status(200).json({ success: true, data: room });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        res.status(200).json({ success: true, data: room });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
    try {
        let imageUrl = '';
        let galleryUrls = [];

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                const result = await uploadToCloudinary(req.files.image[0].buffer, 'rooms');
                imageUrl = result.secure_url;
                
                // Save local backup
                const timestamp = Date.now();
                const filename = `${timestamp}_${req.files.image[0].originalname}`;
                saveImageBackup(req.files.image[0].buffer, filename, 'images/rooms');
            }
            
            if (req.files.gallery) {
                for (let i = 0; i < req.files.gallery.length; i++) {
                    const file = req.files.gallery[i];
                    const result = await uploadToCloudinary(file.buffer, 'rooms/gallery');
                    galleryUrls.push(result.secure_url);
                    
                    // Save local backup
                    const timestamp = Date.now();
                    const filename = `${timestamp}_${i}_${file.originalname}`;
                    saveImageBackup(file.buffer, filename, 'images/rooms');
                }
            }
        }

        const roomData = {
            ...req.body,
            image: imageUrl,
            gallery: galleryUrls
        };

        const room = await Room.create(roomData);
        res.status(201).json({ success: true, data: room });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        let updateData = { ...req.body };
        
        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                // Delete old image
                if (room.image) {
                    const urlParts = room.image.split('/');
                    const publicIdWithExt = urlParts.slice(-2).join('/');
                    const publicId = publicIdWithExt.split('.')[0];
                    await deleteFromCloudinary(`prime-residency/${publicId}`);
                }
                
                const result = await uploadToCloudinary(req.files.image[0].buffer, 'rooms');
                updateData.image = result.secure_url;
                
                // Save local backup
                const timestamp = Date.now();
                const filename = `${timestamp}_${req.files.image[0].originalname}`;
                saveImageBackup(req.files.image[0].buffer, filename, 'images/rooms');
            }
            
            if (req.files.gallery) {
                const galleryUrls = [];
                for (let i = 0; i < req.files.gallery.length; i++) {
                    const file = req.files.gallery[i];
                    const result = await uploadToCloudinary(file.buffer, 'rooms/gallery');
                    galleryUrls.push(result.secure_url);
                    
                    // Save local backup
                    const timestamp = Date.now();
                    const filename = `${timestamp}_${i}_${file.originalname}`;
                    saveImageBackup(file.buffer, filename, 'images/rooms');
                }
                updateData.$push = { gallery: { $each: galleryUrls } };
            }
        }

        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: updatedRoom });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Delete main image
        if (room.image) {
            const urlParts = room.image.split('/');
            const publicIdWithExt = urlParts.slice(-2).join('/');
            const publicId = publicIdWithExt.split('.')[0];
            await deleteFromCloudinary(`prime-residency/${publicId}`);
        }

        // Delete gallery images
        if (room.gallery && room.gallery.length > 0) {
            for (const imageUrl of room.gallery) {
                const urlParts = imageUrl.split('/');
                const publicIdWithExt = urlParts.slice(-2).join('/');
                const publicId = publicIdWithExt.split('.')[0];
                await deleteFromCloudinary(`prime-residency/${publicId}`);
            }
        }

        await Room.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
