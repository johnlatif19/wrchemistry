const argon2 = require('argon2');
const config = require('../../config/environment');
const { generateAdminAccessToken } = require('../../services/jwt');
const { UnauthorizedError, BadRequestError } = require('../../utils/errors');
const { logAction } = require('../../services/audit-log');

const loginAttempts = new Map();

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new BadRequestError('اسم المستخدم وكلمة المرور مطلوبان.');
        }

        const ip = req.ip;
        const attempts = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };

        if (attempts.lockUntil > Date.now()) {
            throw new UnauthorizedError('الحساب مقفل مؤقتاً بسبب محاولات دخول خاطئة متكررة.');
        }

        if (username !== config.admin.username) {
            attempts.count += 1;
            if (attempts.count >= 5) {
                attempts.lockUntil = Date.now() + 15 * 60 * 1000;
            }
            loginAttempts.set(ip, attempts);
            throw new UnauthorizedError('بيانات الدخول غير صحيحة.');
        }

        const isPasswordValid = await argon2.verify(config.admin.passwordHash, password);

        if (!isPasswordValid) {
            attempts.count += 1;
            if (attempts.count >= 5) {
                attempts.lockUntil = Date.now() + 15 * 60 * 1000;
            }
            loginAttempts.set(ip, attempts);
            throw new UnauthorizedError('بيانات الدخول غير صحيحة.');
        }

        loginAttempts.delete(ip);

        const accessToken = generateAdminAccessToken(username);

        res.cookie('admin_access_token', accessToken, {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 
        });

        await logAction('ADMIN_LOGIN', username, {}, ip);

        return res.status(200).json({
            status: 'success',
            message: 'تم تسجيل الدخول بنجاح.'
        });

    } catch (error) {
        return next(error);
    }
};
