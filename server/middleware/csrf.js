const { ForbiddenError } = require('../utils/errors');

const csrfProtection = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigin = process.env.APP_URL || 'https://wrchemistry.vercel.app';

    if (origin && (origin.startsWith(allowedOrigin) || origin.includes('localhost'))) {
        return next();
    }

    return next(new ForbiddenError('فشل التحقق الأمني للطلب (CSRF). يرجى تحديث الصفحة.'));
};

module.exports = { csrfProtection };
