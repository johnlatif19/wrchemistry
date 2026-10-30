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

                const studentsCount = (await database.collection('users').where('role', '==', 'student').count().get()).data().count;
                const assignmentsCount = (await database.collection('assignments').count().get()).data().count;
                const submissionsCount = (await database.collection('submissions').count().get()).data().count;
                const pendingEssaysCount = (await database.collection('answers').where('type', '==', 'essay').where('status', '==', 'pending').count().get()).data().count;
                const cheatingIncidentsCount = (await database.collection('cheatingIncidents').where('status', '==', 'unresolved').count().get()).data().count;

                const submissionsSnapshot = await database.collection('submissions').where('status', '==', 'fully_graded').get();
                let totalScores = 0;
                let gradedCount = 0;
                submissionsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.totalScore !== null && data.maxScore) {
                        totalScores += (data.totalScore / data.maxScore) * 100;
                        gradedCount++;
                    }
                });
                const averageScore = gradedCount > 0 ? (totalScores / gradedCount).toFixed(1) : 0;

                const recentLogsSnapshot = await database.collection('auditLogs').orderBy('timestamp', 'desc').limit(5).get();
                const recentActivities = [];
                recentLogsSnapshot.forEach(doc => {
                    recentActivities.push({ id: doc.id, ...doc.data() });
                });

                return res.status(200).json({
                    status: 'success',
                    data: {
                        totalStudents: studentsCount,
                        totalAssignments: assignmentsCount,
                        totalSubmissions: submissionsCount,
                        pendingEssays: pendingEssaysCount,
                        cheatingIncidents: cheatingIncidentsCount,
                        averageScore,
                        recentActivities
                    }
                });

            } catch (error) {
                return next(error);
            }
        });
    });
};