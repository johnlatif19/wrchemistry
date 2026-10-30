const { ForbiddenError } = require('../utils/errors');

const isAdmin = (req, res, next) => {
    if (req.admin && req.admin.role === 'admin') {
        return next();
    }
    next(new ForbiddenError('هذا الإجراء مخصص لمسؤول النظام فقط.'));
};

const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        return next();
    }
    next(new ForbiddenError('هذا الإجراء مخصص للطلاب فقط.'));
};

const isResourceOwner = (getResourceUserId) => {
    return (req, res, next) => {
        const resourceUserId = getResourceUserId(req);
        
        if (req.admin && req.admin.role === 'admin') {
            return next();
        }

        if (req.user && req.user.uid === resourceUserId) {
            return next();
        }

        next(new ForbiddenError('ليس لديك صلاحية للوصول إلى هذه البيانات.'));
    };
};

module.exports = {
    isAdmin,
    isStudent,
    isResourceOwner
};