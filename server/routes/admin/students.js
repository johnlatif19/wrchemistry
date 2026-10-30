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
                const snapshot = await database.collection('users').where('role', '==', 'student').get();
                
                const students = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    students.push({
                        uid: doc.id,
                        fullName: data.fullName,
                        email: data.email,
                        studentCode: data.studentCode,
                        phone: data.phone,
                        createdAt: data.createdAt
                    });
                });

                return res.status(200).json({ status: 'success', results: students.length, data: students });

            } catch (error) {
                return next(error);
            }
        });
    });
};