const { authenticateStudent } = require('../../middleware/authentication');
const { db } = require('../../services/firebase');
const { BadRequestError, NotFoundError, ConflictError } = require('../../utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateStudent(req, res, async (err) => {
        if (err) return next(err);

        try {
            const assignmentId = req.query.id;
            if (!assignmentId) {
                throw new BadRequestError('معرف الواجب مطلوب.');
            }

            const database = db();
            const assignmentDoc = await database.collection('assignments').doc(assignmentId).get();

            if (!assignmentDoc.exists) {
                throw new NotFoundError('الواجب غير موجود.');
            }

            const now = new Date();
            const assignmentData = assignmentDoc.data();
            const startDate = new Date(assignmentData.startDate);
            const endDate = new Date(assignmentData.endDate);

            if (now < startDate) {
                throw new BadRequestError('لم يبدأ وقت هذا الواجب بعد.');
            }

            if (now > endDate) {
                throw new BadRequestError('انتهى وقت هذا الواجب.');
            }

            const existingSubmission = await database.collection('submissions')
                .where('assignmentId', '==', assignmentId)
                .where('studentId', '==', req.user.uid)
                .limit(1)
                .get();

            if (!existingSubmission.empty) {
                throw new ConflictError('لقد قمت بتسليم هذا الواجب بالفعل.');
            }

            const attemptRef = database.collection('attempts').doc();
            await attemptRef.set({
                assignmentId,
                studentId: req.user.uid,
                startedAt: now.toISOString(),
                status: 'in_progress'
            });

            return res.status(201).json({
                status: 'success',
                message: 'تم بدء الواجب بنجاح.',
                data: {
                    attemptId: attemptRef.id,
                    duration: assignmentData.duration,
                    monitorPolicy: assignmentData.monitorPolicy
                }
            });

        } catch (error) {
            return next(error);
        }
    });
};