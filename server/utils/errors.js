class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends AppError {
    constructor(message = 'طلب غير صالح') {
        super(message, 400);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'غير مصرح لك بالدخول') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'ليس لديك صلاحية للقيام بهذا الإجراء') {
        super(message, 403);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'العنصر المطلوب غير موجود') {
        super(message, 404);
    }
}

class ConflictError extends AppError {
    constructor(message = 'حدث تعارض في البيانات') {
        super(message, 409);
    }
}

class TooManyRequestsError extends AppError {
    constructor(message = 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً') {
        super(message, 429);
    }
}

class InternalServerError extends AppError {
    constructor(message = 'حدث خطأ في الخادم') {
        super(message, 500);
    }
}

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    TooManyRequestsError,
    InternalServerError
};