const { authenticateAdmin } = require('/../../middleware/authentication');
const { isAdmin } = require('/../../middleware/authorization');
const { db } = require('/../../services/firebase');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            try {
                const database = db();
                
                const answersSnapshot = await database.collection('answers')
                    .where('type', '==', 'essay')
                    .where('status', '==', 'pending')
                    .get();

                const pendingEssays = [];

                for (const doc of answersSnapshot.docs) {
                    const answerData = doc.data();
                    
                    const userDoc = await database.collection('users').doc(answerData.studentId).get();
                    const assignmentDoc = await database.collection('assignments').doc(answerData.assignmentId).get();
                    const questionDoc = await database.collection('questions').doc(answerData.questionId).get();

                    pendingEssays.push({
                        answerId: doc.id,
                        studentName: userDoc.exists ? userDoc.data().fullName : 'غير معروف',
                        studentCode: userDoc.exists ? userDoc.data().studentCode : 'غير متاح',
                        assignmentName: assignmentDoc.exists ? assignmentDoc.data().title : 'غير معروف',
                        assignmentId: answerData.assignmentId,
                        questionText: questionDoc.exists ? questionDoc.data().text : 'غير متاح',
                        textAnswer: answerData.textAnswer,
                        attachmentUrl: answerData.attachmentUrl,
                        maxMarks: answerData.maxMarks,
                        submittedAt: answerData.createdAt
                    });
                }

                return res.status(200).json({
                    status: 'success',
                    results: pendingEssays.length,
                    data: pendingEssays
                });

            } catch (error) {
                return next(error);
            }
        });
    });
};