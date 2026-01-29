const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Dynamic storage for different folders
const createStorage = (folderName) => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `prime-residency/${folderName}`,
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        },
    });
};

// Upload function with folder specification
const uploadToCloudinary = async (buffer, folder = 'general') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: `prime-residency/${folder}`,
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        ).end(buffer);
    });
};

// Delete from cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw error;
    }
};

// Create multer upload for different categories
const createUpload = (folder) => {
    const storage = createStorage(folder);
    return multer({ storage: storage });
};

module.exports = { 
    cloudinary, 
    uploadToCloudinary, 
    deleteFromCloudinary, 
    createUpload 
};