const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { saveImageBackup } = require('../utils/imageBackup');

// @desc    Get available rooms for booking
// @route   GET /api/rooms/available
// @access  Public
exports.getAvailableRooms = async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;
        
        // Get all visible rooms
        const allRooms = await Room.find({ visibility: true, status: { $ne: 'Maintenance' } });
        
        if (checkIn && checkOut) {
            // Get currently booked rooms for the date range
            const bookedRooms = await Booking.find({
                status: { $in: ['Confirmed', 'Checked-in'] },
                $or: [
                    {
                        checkIn: { $lte: new Date(checkIn) },
                        checkOut: { $gt: new Date(checkIn) }
                    },
                    {
                        checkIn: { $lt: new Date(checkOut) },
                        checkOut: { $gte: new Date(checkOut) }
                    },
                    {
                        checkIn: { $gte: new Date(checkIn) },
                        checkOut: { $lte: new Date(checkOut) }
                    }
                ]
            }).select('roomNumber');
            
            const bookedRoomNumbers = bookedRooms.map(booking => booking.roomNumber);
            
            // Return only available rooms
            const availableRooms = allRooms.filter(room => 
                !bookedRoomNumbers.includes(room.roomNumber)
            );
            
            res.status(200).json({ 
                success: true, 
                count: availableRooms.length, 
                data: availableRooms 
            });
        } else {
            // Get currently booked rooms (without date filter)
            const bookedRooms = await Booking.find({
                status: { $in: ['Confirmed', 'Checked-in'] },
                checkOut: { $gte: new Date() }
            }).select('roomNumber');
            
            const bookedRoomNumbers = bookedRooms.map(booking => booking.roomNumber);
            
            // Return only available rooms
            const availableRooms = allRooms.filter(room => 
                !bookedRoomNumbers.includes(room.roomNumber)
            );
            
            res.status(200).json({ 
                success: true, 
                count: availableRooms.length, 
                data: availableRooms 
            });
        }
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
    try {
        // Get currently booked rooms
        const bookedRooms = await Booking.find({
            status: { $in: ['Confirmed', 'Checked-in'] },
            checkOut: { $gte: new Date() }
        }).select('roomNumber');
        
        const bookedRoomNumbers = bookedRooms.map(booking => booking.roomNumber);
        
        // Get all rooms and mark booked ones
        const rooms = await Room.find();
        const roomsWithStatus = rooms.map(room => {
            const roomObj = room.toObject();
            if (bookedRoomNumbers.includes(room.roomNumber)) {
                roomObj.status = 'Booked';
                roomObj.isAvailable = false;
            } else {
                roomObj.isAvailable = room.status === 'Available';
            }
            return roomObj;
        });
        
        res.status(200).json({ success: true, count: roomsWithStatus.length, data: roomsWithStatus });
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
        
        // Get recent bookings for this room
        const recentBookings = await Booking.find({ roomNumber: req.params.roomNumber })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('guest', 'name email phone');
        
        const roomData = room.toObject();
        roomData.recentBookings = recentBookings;
        
        res.status(200).json({ success: true, data: roomData });
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
        
        // Convert string 'true'/'false' to boolean for enableExtraCharges
        if (roomData.enableExtraCharges !== undefined) {
            roomData.enableExtraCharges = roomData.enableExtraCharges === 'true' || roomData.enableExtraCharges === true;
        }
        
        // Calculate totalPrice based on enableExtraCharges
        if (roomData.enableExtraCharges) {
            const basePrice = parseFloat(roomData.price) || 0;
            const discount = parseFloat(roomData.discount) || 0;
            const extraBed = parseFloat(roomData.extraBedPrice) || 0;
            const tax = parseFloat(roomData.taxGST) || 0;
            
            const discountAmount = (basePrice * discount) / 100;
            const priceAfterDiscount = basePrice - discountAmount;
            const taxAmount = (priceAfterDiscount * tax) / 100;
            roomData.totalPrice = Math.round(priceAfterDiscount + extraBed + taxAmount);
        } else {
            // If charges disabled, totalPrice = base price
            roomData.totalPrice = roomData.price;
        }

        const room = await Room.create(roomData);
        res.status(201).json({ success: true, data: room });
    } catch (err) {
        if (err.code === 11000 && err.keyPattern?.roomNumber) {
            return res.status(400).json({ success: false, message: `Room number ${err.keyValue.roomNumber} already exists` });
        }
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
        
        // Convert string 'true'/'false' to boolean for enableExtraCharges
        if (updateData.enableExtraCharges !== undefined) {
            updateData.enableExtraCharges = updateData.enableExtraCharges === 'true' || updateData.enableExtraCharges === true;
        }
        
        // Calculate totalPrice based on enableExtraCharges
        if (updateData.enableExtraCharges) {
            const basePrice = parseFloat(updateData.price) || 0;
            const discount = parseFloat(updateData.discount) || 0;
            const extraBed = parseFloat(updateData.extraBedPrice) || 0;
            const tax = parseFloat(updateData.taxGST) || 0;
            
            const discountAmount = (basePrice * discount) / 100;
            const priceAfterDiscount = basePrice - discountAmount;
            const taxAmount = (priceAfterDiscount * tax) / 100;
            updateData.totalPrice = Math.round(priceAfterDiscount + extraBed + taxAmount);
        } else {
            // If charges disabled, totalPrice = base price
            updateData.totalPrice = updateData.price;
        }
        
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
        if (err.code === 11000 && err.keyPattern?.roomNumber) {
            return res.status(400).json({ success: false, message: `Room number ${err.keyValue.roomNumber} already exists` });
        }
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
