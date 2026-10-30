const { authenticateStudent } = require('../../server/middleware/authentication');
const { db } = require('../../server/services/firebase');
const { NotFoundError } = require('../../server/utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateStudent(req, res, async (err) => {
        if (err) return next(err);

        try {
            const database = db();
            const userDoc = await database.collection('users').doc(req.user.uid).get();

            if (!userDoc.exists) {
                throw new NotFoundError('لم يتم العثور على بيانات الطالب.');
            }

            const userData = userDoc.data();

            return res.status(200).json({
                status: 'success',
                data: {
                    uid: userDoc.id,
                    fullName: userData.fullName,
                    email: userData.email,
                    studentCode: userData.studentCode,
                    phone: userData.phone,
                    role: userData.role,
                    createdAt: userData.createdAt
                }
            });

        } catch (error) {
            return next(error);
        }
    });
};