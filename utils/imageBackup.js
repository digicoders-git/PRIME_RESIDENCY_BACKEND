const fs = require('fs');
const path = require('path');
const https = require('https');

// Create backup directories
const createBackupDirs = () => {
    const backupDir = path.join(__dirname, '../backups');
    const dirs = ['images', 'images/gallery', 'images/rooms', 'images/reviews', 'images/services', 'images/facilities', 'bookings'];
    
    dirs.forEach(dir => {
        const fullPath = path.join(backupDir, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
};

// Save image backup locally from buffer
const saveImageBackup = (buffer, filename, category = 'images') => {
    try {
        createBackupDirs();
        const backupPath = path.join(__dirname, '../backups', category, filename);
        fs.writeFileSync(backupPath, buffer);
        console.log(`Image backup saved: ${backupPath}`);
        return backupPath;
    } catch (error) {
        console.error('Failed to save image backup:', error);
        return null;
    }
};

// Download and save image from URL (for Cloudinary URLs)
const downloadAndSaveImage = (imageUrl, filename, category = 'images') => {
    return new Promise((resolve) => {
        try {
            createBackupDirs();
            const backupPath = path.join(__dirname, '../backups', category, filename);
            const file = fs.createWriteStream(backupPath);
            
            https.get(imageUrl, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Image downloaded and saved: ${backupPath}`);
                    resolve(backupPath);
                });
            }).on('error', (error) => {
                console.error('Failed to download image:', error);
                resolve(null);
            });
        } catch (error) {
            console.error('Failed to save image backup:', error);
            resolve(null);
        }
    });
};

module.exports = { saveImageBackup, downloadAndSaveImage, createBackupDirs };