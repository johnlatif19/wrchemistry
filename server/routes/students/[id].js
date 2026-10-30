const { authenticateAdmin } = require('../../middleware/authentication');
const { isAdmin } = require('../../middleware/authorization');
const { db } = require('../../services/firebase');
const { NotFoundError } = require('../../utils/errors');

module.exports = async (req, res, next) => {
    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            const studentId = req.query.id;
            if (!studentId) {
                return next(new NotFoundError('معرف الطالب غير موجود.'));
            }

            try {
                const database = db();
                
                if (req.method === 'GET') {
                    const userDoc = await database.collection('users').doc(studentId).get();
                    if (!userDoc.exists) {
                        throw new NotFoundError('الطالب غير موجود.');
                    }
                    
                    const userData = userDoc.data();

                    const submissionsSnapshot = await database.collection('submissions')
                        .where('studentId', '==', studentId)
                        .get();
                    
                    let totalScore = 0;
                    let submissionsCount = 0;
                    submissionsSnapshot.forEach(doc => {
                        const sub = doc.data();
                        if (sub.totalScore) totalScore += sub.totalScore;
                        submissionsCount++;
                    });

                    return res.status(200).json({
                        status: 'success',
                        data: {
                            uid: userDoc.id,
                            fullName: userData.fullName,
                            email: userData.email,
                            studentCode: userData.studentCode,
                            phone: userData.phone,
                            createdAt: userData.createdAt,
                            stats: {
                                submissionsCount,
                                totalScore
                            }
                        }
                    });
                }

                if (req.method === 'DELETE') {
                    await database.collection('users').doc(studentId).delete();
                    return res.status(200).json({ status: 'success', message: 'تم حذف الطالب بنجاح.' });
                }

                return res.status(405).json({ message: 'Method Not Allowed' });

            } catch (error) {
                return next(error);
            }
        });
    });
};