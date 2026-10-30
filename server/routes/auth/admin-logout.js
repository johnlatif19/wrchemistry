const config = require('../../config/environment');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    res.clearCookie('admin_access_token', {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        path: '/'
    });

    return res.status(200).json({
        status: 'success',
        message: 'تم تسجيل الخروج بنجاح.'
    });
};
