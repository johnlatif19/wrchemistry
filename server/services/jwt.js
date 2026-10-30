const jwt = require('jsonwebtoken');
const config = require('../config/environment');

const generateAdminAccessToken = (username) => {
    return jwt.sign(
        { username, role: 'admin' },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
};

const generateAdminRefreshToken = (username) => {
    return jwt.sign(
        { username, role: 'admin', type: 'refresh' },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, config.jwt.secret);
};

module.exports = {
    generateAdminAccessToken,
    generateAdminRefreshToken,
    verifyToken
};