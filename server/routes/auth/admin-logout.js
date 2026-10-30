const config = require('../../config/environment');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST' || !req.path.endsWith('/admin-logout')) {
        return next();
    }

    res.clearCookie('admin_access_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
    });

    return res.status(200).json({
        status: 'success',
        message: 'تم تسجيل الخروج بنجاح.'
    });
};
