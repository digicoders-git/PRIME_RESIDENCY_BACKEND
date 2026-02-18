const Service = require('../models/Service');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { saveImageBackup } = require('../utils/imageBackup');

// Get all services
const getAllServices = async (req, res) => {
    try {
        const { category, property } = req.query;
        let filter = category ? { category, isActive: true } : { isActive: true };

        if (req.user && req.user.role === 'Manager' && req.user.property) {
            filter.property = req.user.property;
        } else if (property) {
            filter.property = property;
        }

        const services = await Service.find(filter).sort({ order: 1, createdAt: -1 });

        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching services',
            error: error.message
        });
    }
};

// Get service by ID
const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        res.json({
            success: true,
            data: service
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching service',
            error: error.message
        });
    }
};

// Create new service
const createService = async (req, res) => {
    try {
        const { title, subtitle, description, features, category, icon, order } = req.body;

        let imageUrl = '';

        if (req.file) {
            // Use category-based folder structure
            const folderName = category === 'facility' ? 'facilities' : 'services';
            const result = await uploadToCloudinary(req.file.buffer, folderName);
            imageUrl = result.secure_url;

            // Save local backup
            const timestamp = Date.now();
            const filename = `${timestamp}_${req.file.originalname}`;
            const backupCategory = `images/${folderName}`;
            saveImageBackup(req.file.buffer, filename, backupCategory);
        }

        // Parse features properly
        let parsedFeatures = [];
        if (features) {
            try {
                parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
            } catch (e) {
                parsedFeatures = features.split(',').map(f => f.trim());
            }
        }

        const service = new Service({
            title,
            subtitle,
            description,
            image: imageUrl,
            features: parsedFeatures,
            category: category || 'main',
            icon,
            order: parseInt(order) || 0,
            property: (req.user && req.user.property) ? req.user.property : (req.body.property || 'Prime Residency')
        });

        await service.save();

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: service
        });
    } catch (error) {
        console.error('Service creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating service',
            error: error.message
        });
    }
};

// Update service
const updateService = async (req, res) => {
    try {
        const { title, subtitle, description, features, category, icon, order, isActive } = req.body;

        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Property-based check for Managers
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            if (service.property !== req.user.property) {
                return res.status(403).json({ success: false, message: 'Not authorized to update this service' });
            }
        }

        let imageUrl = service.image;

        if (req.file) {
            // Delete old image from cloudinary
            if (service.image) {
                const urlParts = service.image.split('/');
                const publicIdWithExt = urlParts.slice(-2).join('/'); // folder/filename.ext
                const publicId = publicIdWithExt.split('.')[0]; // remove extension
                await deleteFromCloudinary(`prime-residency/${publicId}`);
            }

            // Use category-based folder structure
            const folderName = (category || service.category) === 'facility' ? 'facilities' : 'services';
            const result = await uploadToCloudinary(req.file.buffer, folderName);
            imageUrl = result.secure_url;

            // Save local backup
            const timestamp = Date.now();
            const filename = `${timestamp}_${req.file.originalname}`;
            const backupCategory = `images/${folderName}`;
            saveImageBackup(req.file.buffer, filename, backupCategory);
        }

        // Parse features properly
        let parsedFeatures = service.features;
        if (features !== undefined) {
            try {
                parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
            } catch (e) {
                parsedFeatures = features.split(',').map(f => f.trim());
            }
        }

        const updatedService = await Service.findByIdAndUpdate(
            req.params.id,
            {
                title,
                subtitle,
                description,
                image: imageUrl,
                features: parsedFeatures,
                category: category || service.category,
                icon,
                order: order !== undefined ? parseInt(order) : service.order,
                isActive: isActive !== undefined ? isActive : service.isActive
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Service updated successfully',
            data: updatedService
        });
    } catch (error) {
        console.error('Service update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating service',
            error: error.message
        });
    }
};

// Delete service
const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Property-based check for Managers
        if (req.user && req.user.role === 'Manager' && req.user.property) {
            if (service.property !== req.user.property) {
                return res.status(403).json({ success: false, message: 'Not authorized to delete this service' });
            }
        }

        // Delete image from cloudinary
        if (service.image) {
            const urlParts = service.image.split('/');
            const publicIdWithExt = urlParts.slice(-2).join('/'); // folder/filename.ext
            const publicId = publicIdWithExt.split('.')[0]; // remove extension
            await deleteFromCloudinary(`prime-residency/${publicId}`);
        }

        await Service.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting service',
            error: error.message
        });
    }
};

module.exports = {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
};