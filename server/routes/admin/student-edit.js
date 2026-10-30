const { authenticateAdmin } = require('../../middleware/authentication');
const { isAdmin } = require('../../middleware/authorization');
const { db } = require('../../services/firebase');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const { logAction } = require('../../services/audit-log');

module.exports = async (req, res, next) => {
    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            const studentId = req.query.id;
            if (!studentId) {
                return next(new BadRequestError('معرف الطالب مطلوب.'));
            }

            try {
                const database = db();
                const studentRef = database.collection('users').doc(studentId);
                const studentDoc = await studentRef.get();

                if (!studentDoc.exists) {
                    throw new NotFoundError('الطالب غير موجود.');
                }

                if (req.method === 'PUT' || req.method === 'PATCH') {
                    const { fullName, studentCode, phone, email } = req.body;
                    const updateData = {};
                    
                    if (fullName) updateData.fullName = fullName;
                    if (studentCode) updateData.studentCode = studentCode;
                    if (phone) updateData.phone = phone;
                    if (email) updateData.email = email;

                    if (Object.keys(updateData).length === 0) {
                        throw new BadRequestError('لا توجد بيانات لتحديثها.');
                    }

                    await studentRef.update(updateData);
                    await logAction('STUDENT_UPDATED', req.admin.username, { studentId, updateData }, req.ip);

                    return res.status(200).json({
                        status: 'success',
                        message: 'تم تحديث بيانات الطالب بنجاح.'
                    });
                }

                if (req.method === 'DELETE') {
                    await studentRef.delete();
                    await logAction('STUDENT_DELETED', req.admin.username, { studentId }, req.ip);
                    return res.status(200).json({
                        status: 'success',
                        message: 'تم حذف الطالب بنجاح.'
                    });
                }

                return res.status(405).json({ message: 'Method Not Allowed' });

            } catch (error) {
                return next(error);
            }
        });
    });
};
