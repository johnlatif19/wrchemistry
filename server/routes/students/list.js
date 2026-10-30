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
                const { search, limit = 50 } = req.query;
                const database = db();
                let query = database.collection('users').where('role', '==', 'student');

                const snapshot = await query.orderBy('createdAt', 'desc').limit(parseInt(limit)).get();
                
                let students = [];
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

                if (search) {
                    const searchLower = search.toLowerCase();
                    students = students.filter(s => 
                        s.fullName.toLowerCase().includes(searchLower) || 
                        s.studentCode.includes(searchLower) ||
                        s.email.toLowerCase().includes(searchLower)
                    );
                }

                return res.status(200).json({
                    status: 'success',
                    results: students.length,
                    data: students
                });

            } catch (error) {
                return next(error);
            }
        });
    });
};