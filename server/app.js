const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const config = require('./config/environment');
const { applySecurity } = require('./middleware/security');
const { generalLimiter, apiLimiter } = require('./middleware/rate-limit');
const { csrfProtection } = require('./middleware/csrf');
const { requestSizeLimit } = require('./middleware/validation');
const { AppError } = require('./utils/errors');

const app = express();

applySecurity(app);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(requestSizeLimit);

if (config.env === 'development') {
    app.use(morgan('dev'));
}

app.use('/api', generalLimiter);
app.use('/api', apiLimiter);

app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        return csrfProtection(req, res, next);
    }
    csrfProtection(req, res, next);
});

app.use('/api/auth', require('../api/auth/student-register'));
app.use('/api/auth', require('../api/auth/student-login'));
app.use('/api/auth', require('../api/auth/student-logout'));
app.use('/api/auth', require('../api/auth/forgot-password'));

app.use('/api/admin/auth', require('../api/auth/admin-login'));
app.use('/api/admin/auth', require('../api/auth/admin-logout'));
app.use('/api/admin/auth', require('../api/auth/admin-refresh'));
app.use('/api/admin/auth', require('../api/auth/verify-session'));

app.use('/api/students', require('../api/students/me'));
app.use('/api/students', require('../api/students/list'));
app.use('/api/students', require('../api/students/[id]'));

app.use('/api/assignments', require('../api/assignments/index'));
app.use('/api/assignments', require('../api/assignments/[id]'));
app.use('/api/assignments', require('../api/assignments/[id]-start'));
app.use('/api/assignments', require('../api/assignments/[id]-questions'));

app.use('/api/submissions', require('../api/submissions/index'));
app.use('/api/submissions', require('../api/submissions/[id]'));
app.use('/api/submissions', require('../api/submissions/[id]-answers'));

app.use('/api/grading', require('../api/grading/pending-essays'));
app.use('/api/grading', require('../api/grading/essay-submit'));
app.use('/api/grading', require('../api/grading/essay-publish'));
app.use('/api/grading', require('../api/grading/auto-grade'));

app.use('/api/cheating', require('../api/cheating/log-incident'));
app.use('/api/cheating', require('../api/cheating/list'));
app.use('/api/cheating', require('../api/cheating/[id]'));

app.use('/api/uploads', require('../api/uploads/sign-cloudinary'));
app.use('/api/uploads', require('../api/uploads/confirm-upload'));
app.use('/api/uploads', require('../api/uploads/attachment-[id]'));

app.use('/api/admin', require('../api/admin/stats'));
app.use('/api/admin', require('../api/admin/correct-answers'));
app.use('/api/admin', require('../api/admin/incorrect-answers'));
app.use('/api/admin', require('../api/admin/students'));
app.use('/api/admin', require('../api/admin/settings'));
app.use('/api/admin', require('../api/admin/audit-logs'));

app.use(express.static('public'));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Server is running' });
});

app.use((req, res, next) => {
    next(new AppError('المسار المطلوب غير موجود.', 404));
});

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.env === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            stack: err.stack
        });
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    console.error('ERROR', err);
    return res.status(500).json({
        status: 'error',
        message: 'حدث خطأ غير متوقع في الخادم.'
    });
});

module.exports = app;