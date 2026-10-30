const { authenticateAdmin } = require('../../server/middleware/authentication');
const { isAdmin } = require('../../server/middleware/authorization');
const { db } = require('../../server/services/firebase');
const { BadRequestError, NotFoundError } = require('../../server/utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            try {
                const { submissionId } = req.body;

                if (!submissionId) {
                    throw new BadRequestError('معرف التسليم مطلوب.');
                }

                const database = db();
                const submissionRef = database.collection('submissions').doc(submissionId);
                const submissionDoc = await submissionRef.get();

                if (!submissionDoc.exists) {
                    throw new NotFoundError('التسليم غير موجود.');
                }

                const submissionData = submissionDoc.data();

                const answersSnapshot = await database.collection('answers')
                    .where('assignmentId', '==', submissionData.assignmentId)
                    .where('studentId', '==', submissionData.studentId)
                    .get();

                let hasPending = false;
                let totalScore = 0;

                answersSnapshot.forEach(doc => {
                    const ans = doc.data();
                    if (ans.status === 'pending' || ans.score === null) {
                        hasPending = true;
                    } else {
                        totalScore += ans.score;
                    }
                });

                if (hasPending) {
                    throw new BadRequestError('لا يمكن نشر النتيجة قبل تصحيح جميع الأسئلة المقالية.');
                }

                await submissionRef.update({
                    totalScore: totalScore,
                    status: 'published',
                    publishedAt: new Date().toISOString()
                });

                return res.status(200).json({
                    status: 'success',
                    message: 'تم نشر النتيجة للطالب بنجاح.'
                });

            } catch (error) {
                return next(error);
            }
        });
    });
};