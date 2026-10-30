const { authenticateStudent } = require('../../middleware/authentication');
const { logIncident } = require('../../services/cheating');
const { BadRequestError } = require('../../utils/errors');
const { db } = require('../../services/firebase');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateStudent(req, res, async (err) => {
        if (err) return next(err);

        try {
            const { assignmentId, attemptId, incidentType, metadata } = req.body;

            if (!assignmentId || !incidentType) {
                throw new BadRequestError('بيانات الحادثة غير مكتملة.');
            }

            const validIncidents = ['TAB_SWITCH', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CUT_ATTEMPT', 'CONTEXT_MENU', 'FULLSCREEN_EXIT', 'PAGE_HIDDEN'];
            if (!validIncidents.includes(incidentType)) {
                throw new BadRequestError('نوع الحادثة غير معروف.');
            }

            const database = db();
            const userDoc = await database.collection('users').doc(req.user.uid).get();
            const studentName = userDoc.exists ? userDoc.data().fullName : 'غير معروف';

            const incidentId = await logIncident({
                studentId: req.user.uid,
                studentName,
                assignmentId,
                attemptId: attemptId || null,
                incidentType,
                metadata: metadata || {}
            });

            return res.status(201).json({
                status: 'success',
                message: 'تم تسجيل الحادثة بنجاح.',
                incidentId
            });

        } catch (error) {
            return next(error);
        }
    });
};