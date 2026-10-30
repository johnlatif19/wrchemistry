const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = [
    'FIREBASE_CONFIG',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD_HASH',
    'JWT_SECRET'
];

function validateEnvironment() {
    const missingVars = [];
    const invalidVars = [];

    requiredEnvVars.forEach((varName) => {
        const value = process.env[varName];
        if (!value || value.trim() === '') {
            missingVars.push(varName);
        }
    });

    if (missingVars.length > 0) {
        console.error('ERROR: Missing required environment variables:');
        missingVars.forEach((varName) => console.error(`- ${varName}`));
        console.error('Application cannot start without these variables.');
        process.exit(1);
    }

    try {
        const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
        if (!firebaseConfig.project_id || !firebaseConfig.private_key || !firebaseConfig.client_email) {
            invalidVars.push('FIREBASE_CONFIG (missing required fields)');
        }
    } catch (error) {
        invalidVars.push('FIREBASE_CONFIG (invalid JSON format)');
    }

    if (process.env.JWT_SECRET.length < 32) {
        invalidVars.push('JWT_SECRET (must be at least 32 characters long)');
    }

    if (!process.env.ADMIN_PASSWORD_HASH.startsWith('$argon2id$')) {
        invalidVars.push('ADMIN_PASSWORD_HASH (must be an Argon2id hash)');
    }

    if (invalidVars.length > 0) {
        console.error('ERROR: Invalid environment variable configuration:');
        invalidVars.forEach((varName) => console.error(`- ${varName}`));
        process.exit(1);
    }

    if (process.env.NODE_ENV === 'production') {
        if (process.env.JWT_SECRET === 'secret' || process.env.JWT_SECRET === 'development') {
            console.error('ERROR: Weak JWT_SECRET detected in production. Exiting.');
            process.exit(1);
        }
    }
}

validateEnvironment();

const config = {
    env: process.env.NODE_ENV || 'development',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    port: process.env.PORT || 3000,
    isProduction: process.env.NODE_ENV === 'production',
    
    firebase: {
        config: process.env.FIREBASE_CONFIG
    },
    
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    
    admin: {
        username: process.env.ADMIN_USERNAME,
        passwordHash: process.env.ADMIN_PASSWORD_HASH
    },
    
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
        refreshExpiresIn: '7d'
    },
    
    security: {
        rateLimitWindowMs: 15 * 60 * 1000,
        rateLimitMax: 100,
        loginRateLimitMax: 5,
        maxFileSize: 5 * 1024 * 1024,
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    }
};

module.exports = config;