const { ForbiddenError } = require('../utils/errors');

const csrfProtection = (req, res, next) => {
    // نسمح بالطلبات اللي مش بتغير داتا (زي القراءة) من غير تحقق
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // نتحقق من الـ Origin أو Referer بتاع الطلب
    const origin = req.headers.origin || req.headers.referer;
    
    // هنجيب الدومين بتاعنا من المتغيرات أو نحدده يدوي
    const allowedOrigin = process.env.APP_URL || 'https://wrchemistry.vercel.app';

    // لو الطلب جاي من نفس الدومين بتاعنا، نسمح بيه
    if (origin && origin.startsWith(allowedOrigin)) {
        return next();
    }

    // لو الطلب جاي من مكان تاني، نرفضه
    return next(new ForbiddenError('فشل التحقق الأمني للطلب (CSRF). يرجى تحديث الصفحة.'));
};

module.exports = { csrfProtection };
