const { authenticateAdmin } = require('../../middleware/authentication');
const { isAdmin } = require('../../middleware/authorization');
const { resolveIncident } = require('../../services/cheating');
const { db } = require('../../services/firebase');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const { logAction } = require('../../services/audit-log');

module.exports = async (req, res, next) => {
    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            const incidentId = req.query.id;
            if (!incidentId) {
                return next(new BadRequestError('معرف الحادثة مطلوب.'));
            }

            try {
                const database = db();
                const incidentRef = database.collection('cheatingIncidents').doc(incidentId);

                if (req.method === 'GET') {
                    const doc = await incidentRef.get();
                    if (!doc.exists) {
                        throw new NotFoundError('الحادثة غير موجودة.');
                    }

                    return res.status(200).json({
                        status: 'success',
                        data: { id: doc.id, ...doc.data() }
                    });
                }

                if (req.method === 'PUT' || req.method === 'PATCH') {
                    const { status } = req.body;

                    if (status !== 'resolved') {
                        throw new BadRequestError('حالة الحادثة غير صالحة.');
                    }

                    await resolveIncident(incidentId, req.admin.username);
                    
                    await logAction('CHEATING_INCIDENT_RESOLVED', req.admin.username, { incidentId }, req.ip);

                    return res.status(200).json({
                        status: 'success',
                        message: 'تم تحديد الحادثة كمحلولة.'
                    });
                }

                return res.status(405).json({ message: 'Method Not Allowed' });

            } catch (error) {
                return next(error);
            }
        });
    });
};