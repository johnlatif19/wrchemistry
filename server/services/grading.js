const { db } = require('./firebase');
const { BadRequestError } = require('../utils/errors');

const calculateMCQScore = (studentAnswer, correctAnswer, marks) => {
    const isCorrect = studentAnswer === correctAnswer;
    return {
        score: isCorrect ? marks : 0,
        isCorrect
    };
};

const processAutoGrading = async (assignmentId, studentId, answers) => {
    const database = db();
    
    const questionsSnapshot = await database
        .collection('questions')
        .where('assignmentId', '==', assignmentId)
        .get();

    if (questionsSnapshot.empty) {
        throw new BadRequestError('لا توجد أسئلة لهذا الواجب.');
    }

    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers = [];
    let hasEssay = false;

    for (const doc of questionsSnapshot.docs) {
        const question = doc.data();
        const studentAnswer = answers.find(a => a.questionId === doc.id);
        
        maxScore += question.marks || 0;

        if (question.type === 'mcq') {
            const selectedChoice = studentAnswer ? studentAnswer.selectedChoice : null;
            const gradingResult = calculateMCQScore(
                selectedChoice,
                question.correctAnswer,
                question.marks
            );

            totalScore += gradingResult.score;
            gradedAnswers.push({
                questionId: doc.id,
                type: 'mcq',
                selectedChoice,
                correctAnswer: question.correctAnswer,
                isCorrect: gradingResult.isCorrect,
                score: gradingResult.score,
                maxMarks: question.marks,
                gradedAt: new Date().toISOString()
            });
        } else if (question.type === 'essay') {
            hasEssay = true;
            gradedAnswers.push({
                questionId: doc.id,
                type: 'essay',
                textAnswer: studentAnswer ? studentAnswer.textAnswer : '',
                attachmentUrl: studentAnswer ? studentAnswer.attachmentUrl : null,
                score: null,
                maxMarks: question.marks,
                status: 'pending',
                gradedAt: null
            });
        }
    }

    const submissionStatus = hasEssay ? 'partially_graded' : 'fully_graded';

    await database.collection('submissions').doc().set({
        assignmentId,
        studentId,
        totalScore: hasEssay ? null : totalScore,
        maxScore,
        status: submissionStatus,
        submittedAt: new Date().toISOString()
    });

    const batch = database.batch();
    gradedAnswers.forEach(answer => {
        const answerRef = database.collection('answers').doc();
        batch.set(answerRef, {
            ...answer,
            assignmentId,
            studentId,
            createdAt: new Date().toISOString()
        });
    });

    await batch.commit();

    return {
        totalScore: hasEssay ? null : totalScore,
        maxScore,
        status: submissionStatus,
        hasPendingEssays: hasEssay
    };
};

const gradeEssay = async (answerId, adminUsername, score, feedback) => {
    const database = db();
    const answerRef = database.collection('answers').doc(answerId);
    const answerDoc = await answerRef.get();

    if (!answerDoc.exists) {
        throw new BadRequestError('الإجابة غير موجودة.');
    }

    const answerData = answerDoc.data();
    if (answerData.type !== 'essay') {
        throw new BadRequestError('هذه الإجابة ليست مقالية.');
    }

    if (score > answerData.maxMarks) {
        throw new BadRequestError('الدرجة أكبر من الدرجة القصوى.');
    }

    await answerRef.update({
        score: score,
        feedback: feedback,
        status: 'graded',
        gradedBy: adminUsername,
        gradedAt: new Date().toISOString()
    });

    const submissionSnapshot = await database
        .collection('submissions')
        .where('assignmentId', '==', answerData.assignmentId)
        .where('studentId', '==', answerData.studentId)
        .limit(1)
        .get();

    if (!submissionSnapshot.empty) {
        const submissionDoc = submissionSnapshot.docs[0];
        const submissionRef = database.collection('submissions').doc(submissionDoc.id);
        
        const allAnswersSnapshot = await database
            .collection('answers')
            .where('assignmentId', '==', answerData.assignmentId)
            .where('studentId', '==', answerData.studentId)
            .get();

        let newTotalScore = 0;
        let allGraded = true;

        allAnswersSnapshot.forEach(doc => {
            const ans = doc.data();
            if (ans.score !== null && ans.score !== undefined) {
                newTotalScore += ans.score;
            } else {
                allGraded = false;
            }
        });

        await submissionRef.update({
            totalScore: allGraded ? newTotalScore : null,
            status: allGraded ? 'fully_graded' : 'partially_graded'
        });
    }

    return { success: true };
};

module.exports = {
    calculateMCQScore,
    processAutoGrading,
    gradeEssay
};