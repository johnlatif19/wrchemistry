const { authenticateStudent } = require('../../server/middleware/authentication');
const { db } = require('../../server/services/firebase');
const { NotFoundError, ForbiddenError } = require('../../server/utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateStudent(req, res, async (err) => {
        if (err) return next(err);

        try {
            const submissionId = req.query.id;

            if (!submissionId) {
                throw new NotFoundError('معرف التسليم غير موجود.');
            }

            const database = db();
            const submissionDoc = await database.collection('submissions').doc(submissionId).get();

            if (!submissionDoc.exists) {
                throw new NotFoundError('التسليم غير موجود.');
            }

            const submissionData = submissionDoc.data();

            if (submissionData.studentId !== req.user.uid) {
                throw new ForbiddenError('ليس لديك صلاحية لعرض هذا التسليم.');
            }

            return res.status(200).json({
                status: 'success',
                data: { id: submissionDoc.id, ...submissionData }
            });

        } catch (error) {
            return next(error);
        }
    });
};