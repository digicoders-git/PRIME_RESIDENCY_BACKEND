require('dotenv').config();

console.log('Testing Cloudinary Config...');
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    console.log('Cloudinary config is present.');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
    console.error('Cloudinary config is MISSING.');
    console.log('CLOUD_NAME:', !!process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API_KEY:', !!process.env.CLOUDINARY_API_KEY);
    console.log('API_SECRET:', !!process.env.CLOUDINARY_API_SECRET);
}
