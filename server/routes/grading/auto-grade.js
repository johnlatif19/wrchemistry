const { authenticateAdmin } = require('../../middleware/authentication');
const { isAdmin } = require('../../middleware/authorization');
const { processAutoGrading } = require('../../services/grading');
const { BadRequestError } = require('../../utils/errors');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            try {
                const { assignmentId, studentId, answers } = req.body;

                if (!assignmentId || !studentId || !answers) {
                    throw new BadRequestError('بيانات التصحيح التلقائي غير مكتملة.');
                }

                const result = await processAutoGrading(assignmentId, studentId, answers);

                return res.status(200).json({
                    status: 'success',
                    data: result
                });

            } catch (error) {
                return next(error);
            }
        });
    });
};