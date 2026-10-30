const { authenticateAdmin } = require('../../server/middleware/authentication');
const { isAdmin } = require('../../server/middleware/authorization');
const { db } = require('../../server/services/firebase');
const { BadRequestError, NotFoundError } = require('../../server/utils/errors');

module.exports = async (req, res, next) => {
    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            const assignmentId = req.query.id;
            if (!assignmentId) {
                return next(new BadRequestError('معرف الواجب مطلوب.'));
            }

            try {
                const database = db();
                const assignmentRef = database.collection('assignments').doc(assignmentId);
                const assignmentDoc = await assignmentRef.get();

                if (!assignmentDoc.exists) {
                    throw new NotFoundError('الواجب غير موجود.');
                }

                if (req.method === 'GET') {
                    const questionsSnapshot = await database.collection('questions')
                        .where('assignmentId', '==', assignmentId)
                        .orderBy('order', 'asc')
                        .get();

                    const questions = [];
                    questionsSnapshot.forEach(doc => {
                        questions.push({ id: doc.id, ...doc.data() });
                    });

                    return res.status(200).json({
                        status: 'success',
                        data: {
                            id: assignmentDoc.id,
                            ...assignmentDoc.data(),
                            questions
                        }
                    });
                }

                if (req.method === 'PUT' || req.method === 'PATCH') {
                    const updateData = req.body;
                    delete updateData.id;
                    delete updateData.teacherId;
                    
                    await assignmentRef.update({
                        ...updateData,
                        updatedAt: new Date().toISOString()
                    });

                    return res.status(200).json({
                        status: 'success',
                        message: 'تم تحديث الواجب بنجاح.'
                    });
                }

                if (req.method === 'DELETE') {
                    await assignmentRef.delete();
                    return res.status(200).json({
                        status: 'success',
                        message: 'تم حذف الواجب بنجاح.'
                    });
                }

                return res.status(405).json({ message: 'Method Not Allowed' });

            } catch (error) {
                return next(error);
            }
        });
    });
};