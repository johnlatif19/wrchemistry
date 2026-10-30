const { authenticateStudent } = require('../../middleware/authentication');
const { authenticateAdmin } = require('../../middleware/authentication');
const { isAdmin } = require('../../middleware/authorization');
const { db } = require('../../services/firebase');
const { BadRequestError } = require('../../utils/errors');
const { logAction } = require('../../services/audit-log');

module.exports = async (req, res, next) => {
    if (req.method === 'GET') {
        return authenticateStudent(req, res, async (err) => {
            if (err) return next(err);
            try {
                const { status } = req.query;
                const database = db();
                const now = new Date().toISOString();
                
                let query = database.collection('assignments').where('status', '==', 'published');

                if (status === 'upcoming') {
                    query = query.where('startDate', '>', now);
                } else if (status === 'available') {
                    query = query.where('startDate', '<=', now).where('endDate', '>=', now);
                } else if (status === 'completed') {
                    query = query.where('endDate', '<', now);
                }

                const snapshot = await query.orderBy('endDate', 'asc').get();
                
                const assignments = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    assignments.push({
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        duration: data.duration,
                        maxAttempts: data.maxAttempts
                    });
                });

                return res.status(200).json({
                    status: 'success',
                    data: assignments
                });
            } catch (error) {
                return next(error);
            }
        });
    }

    if (req.method === 'POST') {
        return authenticateAdmin(req, res, (err) => {
            if (err) return next(err);
            isAdmin(req, res, async (authErr) => {
                if (authErr) return next(authErr);

                try {
                    const { title, description, startDate, endDate, duration, maxAttempts, randomOrder, monitorPolicy, questions } = req.body;

                    if (!title || !startDate || !endDate || !questions || questions.length === 0) {
                        throw new BadRequestError('بيانات الواجب غير مكتملة.');
                    }

                    const database = db();
                    const assignmentRef = database.collection('assignments').doc();
                    const assignmentId = assignmentRef.id;

                    const assignmentData = {
                        title,
                        description: description || '',
                        startDate,
                        endDate,
                        duration: Number(duration) || 60,
                        maxAttempts: Number(maxAttempts) || 1,
                        randomOrder: Boolean(randomOrder),
                        monitorPolicy: monitorPolicy || 'warning',
                        status: 'published',
                        teacherId: req.admin.username,
                        createdAt: new Date().toISOString()
                    };

                    await assignmentRef.set(assignmentData);

                    const batch = database.batch();
                    questions.forEach((q, index) => {
                        const questionRef = database.collection('questions').doc();
                        batch.set(questionRef, {
                            assignmentId,
                            type: q.type,
                            source: q.source || 'manual',
                            text: q.text || '',
                            imageUrl: q.imageUrl || null,
                            choices: q.choices || [],
                            correctAnswer: q.correctAnswer,
                            marks: Number(q.marks) || 1,
                            explanation: q.explanation || '',
                            order: index
                        });
                    });

                    await batch.commit();

                    await logAction('ASSIGNMENT_CREATED', req.admin.username, { assignmentId, title }, req.ip);

                    return res.status(201).json({
                        status: 'success',
                        message: 'تم إنشاء الواجب بنجاح.',
                        data: { id: assignmentId }
                    });

                } catch (error) {
                    return next(error);
                }
            });
        });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
};