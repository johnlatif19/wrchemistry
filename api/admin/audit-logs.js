const { authenticateAdmin } = require('../../server/middleware/authentication');
const { isAdmin } = require('../../server/middleware/authorization');
const { db } = require('../../server/services/firebase');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            try {
                const { limit = 100 } = req.query;
                const database = db();
                
                const snapshot = await database.collection('auditLogs')
                    .orderBy('timestamp', 'desc')
                    .limit(parseInt(limit))
                    .get();

                const logs = [];
                snapshot.forEach(doc => {
                    logs.push({ id: doc.id, ...doc.data() });
                });

                return res.status(200).json({ status: 'success', results: logs.length, data: logs });

            } catch (error) {
                return next(error);
            }
        });
    });
};