const { authenticateStudent } = require('../../server/middleware/authentication');
const { db } = require('../../server/services/firebase');
const { NotFoundError, BadRequestError } = require('../../server/utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
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

            const existingSubmission = await database.collection('submissions')
                .where('assignmentId', '==', assignmentId)
                .where('studentId', '==', req.user.uid)
                .limit(1)
                .get();

            if (!existingSubmission.empty) {
                throw new BadRequestError('لا يمكنك عرض الأسئلة بعد تسليم الواجب.');
            }

            let questionsQuery = database.collection('questions')
                .where('assignmentId', '==', assignmentId);

            const assignmentData = assignmentDoc.data();
            
            if (!assignmentData.randomOrder) {
                questionsQuery = questionsQuery.orderBy('order', 'asc');
            }

            const questionsSnapshot = await questionsQuery.get();
            const questions = [];

            questionsSnapshot.forEach(doc => {
                const qData = doc.data();
                questions.push({
                    id: doc.id,
                    type: qData.type,
                    source: qData.source,
                    text: qData.text,
                    imageUrl: qData.imageUrl,
                    choices: qData.choices,
                    marks: qData.marks
                });
            });

            if (assignmentData.randomOrder) {
                questions.sort(() => Math.random() - 0.5);
            }

            return res.status(200).json({
                status: 'success',
                data: questions
            });

        } catch (error) {
            return next(error);
        }
    });
};