const { verifyToken } = require('../../services/jwt');
const { UnauthorizedError } = require('../../utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        console.log('[VERIFY-SESSION] Cookie names:', Object.keys(req.cookies || {}));
        console.log('[VERIFY-SESSION] Has admin_access_token:', !!req.cookies['admin_access_token']);
        console.log('[VERIFY-SESSION] Origin:', req.headers.origin);
        console.log('[VERIFY-SESSION] Referer:', req.headers.referer);

        const token = req.cookies['admin_access_token'];
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
        console.log('[VERIFY-SESSION] Error:', error.message);
        return next(new UnauthorizedError('جلسة غير صالحة أو منتهية.'));
    }
};
