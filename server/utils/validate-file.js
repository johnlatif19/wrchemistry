const config = require('../config/environment');

const fileSignatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'image/gif': [0x47, 0x49, 0x46]
};

function checkFileSignature(buffer, mimeType) {
    if (!buffer || buffer.length < 4) return false;
    
    const signature = fileSignatures[mimeType];
    if (!signature) return false;

    for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
            return false;
        }
    }
    return true;
}

function validateFile(file) {
    if (!file) {
        return { isValid: false, message: 'لم يتم إرفاق أي ملف' };
    }

    if (file.size > config.security.maxFileSize) {
        return { 
            isValid: false, 
            message: `حجم الملف يتجاوز الحد المسموح به (${config.security.maxFileSize / (1024 * 1024)} ميجابايت)` 
        };
    }

    if (!config.security.allowedImageTypes.includes(file.mimetype)) {
        return { 
            isValid: false, 
            message: 'نوع الملف غير مسموح به. يرجى رفع صورة (JPG, PNG, WEBP, GIF)' 
        };
    }

    if (file.buffer && !checkFileSignature(file.buffer, file.mimetype)) {
        return { 
            isValid: false, 
            message: 'محتوى الملف لا يتطابق مع صيغته. يرجى رفع صورة صالحة.' 
        };
    }

    return { isValid: true, message: 'الملف صالح' };
}

function generateRandomFileName(originalName) {
    const crypto = require('crypto');
    const extension = originalName.split('.').pop();
    const randomName = crypto.randomBytes(16).toString('hex');
    return `${randomName}.${extension}`;
}

module.exports = {
    validateFile,
    generateRandomFileName,
    checkFileSignature
};