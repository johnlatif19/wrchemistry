const { validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/errors');
const { sanitizeObject } = require('../utils/sanitize');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return next(new BadRequestError(errorMessages));
    }
    
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

const requestSizeLimit = (req, res, next) => {
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        return next(new BadRequestError('حجم الطلب كبير جداً. الحد الأقصى 10 ميجابايت.'));
    }
    next();
};

module.exports = {
    validate,
    requestSizeLimit
};