const { authenticateAdmin } = require('../../middleware/authentication');
const { isAdmin } = require('../../middleware/authorization');
const { db } = require('../../services/firebase');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            try {
                const { assignmentId, studentId, limit = 50 } = req.query;
                const database = db();

                let query = database.collection('answers').where('type', '==', 'mcq').where('isCorrect', '==', false);

                if (assignmentId) query = query.where('assignmentId', '==', assignmentId);
                if (studentId) query = query.where('studentId', '==', studentId);

                const answersSnapshot = await query.limit(parseInt(limit)).get();

                const incorrectAnswers = [];
                for (const doc of answersSnapshot.docs) {
                    const ansData = doc.data();
                    
                    const userDoc = await database.collection('users').doc(ansData.studentId).get();
                    const assignmentDoc = await database.collection('assignments').doc(ansData.assignmentId).get();
                    const questionDoc = await database.collection('questions').doc(ansData.questionId).get();

                    incorrectAnswers.push({
                        id: doc.id,
                        studentName: userDoc.exists ? userDoc.data().fullName : 'غير معروف',
                        studentCode: userDoc.exists ? userDoc.data().studentCode : 'غير متاح',
                        assignmentTitle: assignmentDoc.exists ? assignmentDoc.data().title : 'غير معروف',
                        questionText: questionDoc.exists ? questionDoc.data().text : 'غير متاح',
                        choices: questionDoc.exists ? questionDoc.data().choices : [],
                        selectedAnswer: ansData.selectedChoice,
                        correctAnswer: ansData.correctAnswer,
                        marksLost: ansData.maxMarks
                    });
                }

                return res.status(200).json({ status: 'success', results: incorrectAnswers.length, data: incorrectAnswers });

            } catch (error) {
                return next(error);
            }
        });
    });
};