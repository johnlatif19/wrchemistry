const { authenticateStudent } = require('../../server/middleware/authentication');
const { db } = require('../../server/services/firebase');
const { BadRequestError, ForbiddenError } = require('../../server/utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateStudent(req, res, async (err) => {
        if (err) return next(err);

        try {
            const { publicId, secureUrl, assignmentId, questionId, type } = req.body;

            if (!publicId || !secureUrl) {
                throw new BadRequestError('بيانات الملف المرفوع غير مكتملة.');
            }

            if (!secureUrl.startsWith('https://res.cloudinary.com/')) {
                throw new ForbiddenError('رابط الملف غير صالح.');
            }

            const database = db();
            const uploadRecord = {
                studentId: req.user.uid,
                publicId,
                secureUrl,
                assignmentId: assignmentId || null,
                questionId: questionId || null,
                type: type || 'submission_attachment',
                uploadedAt: new Date().toISOString()
            };

            const docRef = await database.collection('uploads').add(uploadRecord);

            return res.status(201).json({
                status: 'success',
                data: {
                    uploadId: docRef.id,
                    secureUrl
                }
            });

        } catch (error) {
            return next(error);
        }
    });
};