const config = require('../../config/environment');
const { verifyToken, generateAdminAccessToken } = require('../../services/jwt');
const { UnauthorizedError } = require('../../utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
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
            secure: config.isProduction,
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        return res.status(200).json({
            status: 'success',
            message: 'تم تحديث الجلسة بنجاح.'
        });

    } catch (error) {
        return next(new UnauthorizedError('انتهت الجلسة. يرجى تسجيل الدخول مجدداً.'));
    }
};