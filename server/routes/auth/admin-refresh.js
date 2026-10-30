const config = require('../../config/environment');
const { verifyToken, generateAdminAccessToken } = require('../../services/jwt');
const { UnauthorizedError } = require('../../utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST' || !req.path.endsWith('/admin-refresh')) {
        return next();
    }

    try {
        const currentToken = req.cookies['admin_access_token'];
        if (!currentToken) {
            throw new UnauthorizedError('لا توجد جلسة لتحديثها.');
        }

        const decoded = verifyToken(currentToken);
        const newAccessToken = generateAdminAccessToken(decoded.username);

        res.cookie('admin_access_token', newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 15 * 60 * 1000,
            path: '/'
        });

        return res.status(200).json({
            status: 'success',
            message: 'تم تحديث الجلسة بنجاح.'
        });

    } catch (error) {
        return next(new UnauthorizedError('انتهت الجلسة. يرجى تسجيل الدخول مجدداً.'));
    }
};
