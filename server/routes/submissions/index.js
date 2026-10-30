const { authenticateStudent } = require('/../../middleware/authentication');
const { db } = require('/../../services/firebase');
const { processAutoGrading } = require('/../../services/grading');
const { BadRequestError, ConflictError } = require('/../../utils/errors');
const { logAction } = require('/../../services/audit-log');

module.exports = async (req, res, next) => {
    if (req.method === 'GET') {
        return authenticateStudent(req, res, async (err) => {
            if (err) return next(err);
            try {
                const database = db();
                const snapshot = await database.collection('submissions')
                    .where('studentId', '==', req.user.uid)
                    .orderBy('submittedAt', 'desc')
                    .get();

                const submissions = [];
                snapshot.forEach(doc => {
                    submissions.push({ id: doc.id, ...doc.data() });
                });

                return res.status(200).json({ status: 'success', data: submissions });
            } catch (error) {
                return next(error);
            }
        });
    }

    if (req.method === 'POST') {
        return authenticateStudent(req, res, async (err) => {
            if (err) return next(err);

            try {
                const { assignmentId, answers, attemptId } = req.body;

                if (!assignmentId || !answers || !Array.isArray(answers)) {
                    throw new BadRequestError('بيانات التسليم غير مكتملة.');
                }

                const database = db();
                
                const existingSubmission = await database.collection('submissions')
                    .where('assignmentId', '==', assignmentId)
                    .where('studentId', '==', req.user.uid)
                    .limit(1)
                    .get();

                if (!existingSubmission.empty) {
                    throw new ConflictError('لقد قمت بتسليم هذا الواجب بالفعل. لا يمكن التعديل بعد التسليم.');
                }

                const assignmentDoc = await database.collection('assignments').doc(assignmentId).get();
                if (!assignmentDoc.exists) {
                    throw new BadRequestError('الواجب غير موجود.');
                }

                const assignmentData = assignmentDoc.data();
                const now = new Date();
                const endDate = new Date(assignmentData.endDate);

                if (now > endDate) {
                    throw new BadRequestError('انتهى الوقت المخصص لتسليم هذا الواجب.');
                }

                const gradingResult = await processAutoGrading(assignmentId, req.user.uid, answers);

                await logAction('SUBMISSION_CREATED', req.user.uid, { assignmentId, attemptId }, req.ip);

                return res.status(201).json({
                    status: 'success',
                    message: 'تم تسليم الواجب بنجاح.',
                    data: gradingResult
                });

            } catch (error) {
                return next(error);
            }
        });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
};