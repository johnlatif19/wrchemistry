const cloudinary = require('cloudinary').v2;
const config = require('../config/environment');

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
});

const generateUploadSignature = (folder = 'wrchemistry') => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const paramsToSign = {
        timestamp: timestamp,
        folder: folder
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        config.cloudinary.apiSecret
    );

    return {
        timestamp,
        signature,
        folder,
        apiKey: config.cloudinary.apiKey,
        cloudName: config.cloudinary.cloudName
    };
};

const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Cloudinary delete error:', error.message);
        return false;
    }
};

module.exports = {
    cloudinary,
    generateUploadSignature,
    deleteImage
};