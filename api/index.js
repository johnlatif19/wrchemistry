const express = require('express');
const app = express();

// Middlewares الأساسية
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// استيراد كل الـ Routes اللي إحنا عملناها (بس من غير ما نحطها في فولدر api)
const authRoutes = require('../server/routes/auth');
const assignmentRoutes = require('../server/routes/assignments');
const studentRoutes = require('../server/routes/students');
const submissionRoutes = require('../server/routes/submissions');
const gradingRoutes = require('../server/routes/grading');
const cheatingRoutes = require('../server/routes/cheating');
const uploadRoutes = require('../server/routes/uploads');
const adminRoutes = require('../server/routes/admin');

// ربط المسارات
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/cheating', cheatingRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);

// تصدير التطبيق لـ Vercel
module.exports = app;
