const { verifyToken } = require('../../services/jwt');
const { UnauthorizedError } = require('../../utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET' || !req.path.endsWith('/verify-session')) {
        return next();
    }

    try {
        let token = req.cookies['admin_access_token'];

        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new UnauthorizedError('لا توجد جلسة نشطة.');
        }

        const decoded = verifyToken(token);
        if (decoded.role !== 'admin') {
            throw new UnauthorizedError('صلاحيات غير كافية.');
        }

        return res.status(200).json({
            status: 'success',
            data: { username: decoded.username, role: decoded.role }
        });

    } catch (error) {
        return next(new UnauthorizedError('جلسة غير صالحة أو منتهية.'));
    }
};
