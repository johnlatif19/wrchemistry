const config = require('../config/environment');
const jwt = require('jsonwebtoken');
const { verifyIdToken } = require('../services/firebase');
const { UnauthorizedError } = require('../utils/errors');

const authenticateStudent = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new UnauthorizedError('يجب تسجيل الدخول أولاً.'));
        }

        const idToken = authHeader.split(' ')[1];
        const decodedToken = await verifyIdToken(idToken);

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: 'student'
        };

        next();
    } catch (error) {
        next(new UnauthorizedError('انتهت الجلسة أو أن الرمز غير صالح. يرجى تسجيل الدخول مرة أخرى.'));
    }
};

const authenticateAdmin = (req, res, next) => {
    try {
        let token = req.cookies['admin_access_token'];

        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new UnauthorizedError('يجب تسجيل الدخول كمسؤول.'));
        }

        const decoded = jwt.verify(token, config.jwt.secret);

        if (decoded.role !== 'admin') {
            return next(new UnauthorizedError('صلاحيات غير كافية.'));
        }

        req.admin = {
            username: decoded.username,
            role: 'admin'
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'));
        }
        return next(new UnauthorizedError('رمز الدخول غير صالح.'));
    }
};

const verifyAdminCookieOnly = (req, res, next) => {
    const token = req.cookies['admin_access_token'];
    if (!token) {
        return next(new UnauthorizedError('غير مصرح.'));
    }
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        if (decoded.role !== 'admin') throw new Error();
        req.admin = decoded;
        next();
    } catch (err) {
        next(new UnauthorizedError('جلسة غير صالحة.'));
    }
};

module.exports = {
    authenticateStudent,
    authenticateAdmin,
    verifyAdminCookieOnly
};
