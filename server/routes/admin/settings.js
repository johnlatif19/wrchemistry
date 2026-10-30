const { authenticateAdmin } = require('../../middleware/authentication');
const { isAdmin } = require('../../middleware/authorization');
const { db } = require('../../services/firebase');

module.exports = async (req, res, next) => {
    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            try {
                const database = db();
                const settingsRef = database.collection('settings').doc('global');

                if (req.method === 'GET') {
                    const doc = await settingsRef.get();
                    const settings = doc.exists ? doc.data() : {
                        platformName: 'WR Chemistry',
                        teacherName: 'وليد الروضي',
                        allowRegistration: true,
                        requireFullscreen: true
                    };

                    return res.status(200).json({ status: 'success', data: settings });
                }

                if (req.method === 'PUT' || req.method === 'PATCH') {
                    const updateData = req.body;
                    await settingsRef.set(updateData, { merge: true });

                    return res.status(200).json({ status: 'success', message: 'تم حفظ الإعدادات بنجاح.' });
                }

                return res.status(405).json({ message: 'Method Not Allowed' });

            } catch (error) {
                return next(error);
            }
        });
    });
};