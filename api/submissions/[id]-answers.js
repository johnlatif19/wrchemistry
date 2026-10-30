const { authenticateStudent } = require('../../server/middleware/authentication');
const { db } = require('../../server/services/firebase');
const { NotFoundError, ForbiddenError } = require('../../server/utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateStudent(req, res, async (err) => {
        if (err) return next(err);

        try {
            const submissionId = req.query.id;

            if (!submissionId) {
                throw new NotFoundError('معرف التسليم غير موجود.');
            }

            const database = db();
            
            const submissionDoc = await database.collection('submissions').doc(submissionId).get();
            if (!submissionDoc.exists) {
                throw new NotFoundError('التسليم غير موجود.');
            }

            const submissionData = submissionDoc.data();

            if (submissionData.studentId !== req.user.uid) {
                throw new ForbiddenError('ليس لديك صلاحية لعرض إجابات هذا التسليم.');
            }

            const answersSnapshot = await database.collection('answers')
                .where('assignmentId', '==', submissionData.assignmentId)
                .where('studentId', '==', req.user.uid)
                .get();

            const answers = [];
            answersSnapshot.forEach(doc => {
                const data = doc.data();
                if (submissionData.status === 'fully_graded' || data.status === 'graded') {
                    answers.push({ id: doc.id, ...data });
                } else {
                    const { correctAnswer, ...safeData } = data;
                    answers.push({ id: doc.id, ...safeData });
                }
            });

            return res.status(200).json({
                status: 'success',
                data: answers
            });

        } catch (error) {
            return next(error);
        }
    });
};