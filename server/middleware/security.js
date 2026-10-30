const helmet = require('helmet');
const cors = require('cors');
const config = require('../config/environment');

const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://apis.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://firebasestorage.googleapis.com"],
            connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com"],
            frameSrc: ["'self'", "https://wrchemistry.firebaseapp.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: config.isProduction ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            config.appUrl,
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};

const applySecurity = (app) => {
    app.use(securityHeaders);
    app.use(cors(corsOptions));
    app.use((req, res, next) => {
        res.removeHeader('X-Powered-By');
        next();
    });
};

module.exports = { applySecurity };