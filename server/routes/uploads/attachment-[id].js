const { authenticateStudent } = require('../../middleware/authentication');
const { db } = require('../../services/firebase');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');
const { isAdmin } = require('../../middleware/authorization');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateStudent(req, res, async (err) => {
        if (err) return next(err);

        try {
            const uploadId = req.query.id;

            if (!uploadId) {
                throw new NotFoundError('معرف الملف غير موجود.');
            }

            const database = db();
            const uploadDoc = await database.collection('uploads').doc(uploadId).get();

            if (!uploadDoc.exists) {
                throw new NotFoundError('الملف المطلوب غير موجود.');
            }

            const uploadData = uploadDoc.data();

            if (uploadData.studentId !== req.user.uid) {
                throw new ForbiddenError('ليس لديك صلاحية للوصول إلى هذا الملف.');
            }

            return res.status(200).json({
                status: 'success',
                data: {
                    id: uploadDoc.id,
                    secureUrl: uploadData.secureUrl,
                    uploadedAt: uploadData.uploadedAt
                }
            });

        } catch (error) {
            return next(error);
        }
    });
};