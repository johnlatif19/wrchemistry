const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const config = require('./config/environment');
const { applySecurity } = require('./middleware/security');
const { generalLimiter, apiLimiter } = require('./middleware/rate-limit');
const { csrfProtection } = require('./middleware/csrf');
const { requestSizeLimit } = require('./middleware/validation');
const { AppError } = require('./utils/errors');

const app = express();

app.set('trust proxy', 1);
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

app.use('/api/auth', require('./routes/auth/student-register'));
app.use('/api/auth', require('./routes/auth/student-login'));
app.use('/api/auth', require('./routes/auth/student-logout'));
app.use('/api/auth', require('./routes/auth/forgot-password'));

app.use('/api/admin/auth', require('./routes/auth/admin-login'));
app.use('/api/admin/auth', require('./routes/auth/admin-logout'));
app.use('/api/admin/auth', require('./routes/auth/admin-refresh'));
app.use('/api/admin/auth', require('./routes/auth/verify-session'));

app.use('/api/students', require('./routes/students/me'));
app.use('/api/students', require('./routes/students/list'));
app.use('/api/students', require('./routes/students/[id]'));

app.use('/api/assignments', require('./routes/assignments/index'));
app.use('/api/assignments', require('./routes/assignments/[id]'));
app.use('/api/assignments', require('./routes/assignments/[id]-start'));
app.use('/api/assignments', require('./routes/assignments/[id]-questions'));

app.use('/api/submissions', require('./routes/submissions/index'));
app.use('/api/submissions', require('./routes/submissions/[id]'));
app.use('/api/submissions', require('./routes/submissions/[id]-answers'));

app.use('/api/grading', require('./routes/grading/pending-essays'));
app.use('/api/grading', require('./routes/grading/essay-submit'));
app.use('/api/grading', require('./routes/grading/essay-publish'));
app.use('/api/grading', require('./routes/grading/auto-grade'));

app.use('/api/cheating', require('./routes/cheating/log-incident'));
app.use('/api/cheating', require('./routes/cheating/list'));
app.use('/api/cheating', require('./routes/cheating/[id]'));

app.use('/api/uploads', require('./routes/uploads/sign-cloudinary'));
app.use('/api/uploads', require('./routes/uploads/confirm-upload'));
app.use('/api/uploads', require('./routes/uploads/attachment-[id]'));

app.use('/api/admin', require('./routes/admin/stats'));
app.use('/api/admin', require('./routes/admin/correct-answers'));
app.use('/api/admin', require('./routes/admin/incorrect-answers'));
app.use('/api/admin', require('./routes/admin/students'));
app.use('/api/admin', require('./routes/admin/settings'));
app.use('/api/admin', require('./routes/admin/audit-logs'));

app.get('/login-student', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'login-student.html')));
app.get('/login-admin', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'login-admin.html')));
app.get('/sign-student', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'sign-student.html')));
app.get('/dashboard-admin', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'dashboard-admin.html')));
app.get('/exam', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'exam.html')));
app.get('/homework', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'homework.html')));

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'login-student.html'));
});

app.use(express.static(path.join(process.cwd(), 'public')));

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
