const crypto = require('crypto');
const config = require('../config/environment');
const { ForbiddenError } = require('../utils/errors');

const csrfProtection = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const token = crypto.randomBytes(32).toString('hex');
        res.cookie('csrf_token', token, {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: 'strict'
        });
        res.setHeader('X-CSRF-Token', token);
        return next();
    }

    const cookieToken = req.cookies['csrf_token'];
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return next(new ForbiddenError('فشل التحقق الأمني للطلب (CSRF). يرجى تحديث الصفحة.'));
    }

    next();
};

module.exports = { csrfProtection };