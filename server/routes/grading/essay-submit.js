const { authenticateAdmin } = require('/../../middleware/authentication');
const { isAdmin } = require('/../../middleware/authorization');
const { gradeEssay } = require('/../../services/grading');
const { BadRequestError } = require('/../../utils/errors');
const { logAction } = require('/../../services/audit-log');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            try {
                const { answerId, score, feedback } = req.body;

                if (!answerId || score === undefined) {
                    throw new BadRequestError('بيانات التصحيح غير مكتملة.');
                }

                const numericScore = Number(score);
                if (isNaN(numericScore) || numericScore < 0) {
                    throw new BadRequestError('الدرجة يجب أن تكون رقماً صحيحاً وموجباً.');
                }

                await gradeEssay(answerId, req.admin.username, numericScore, feedback || '');

                await logAction('ESSAY_GRADED', req.admin.username, {
                    answerId,
                    score: numericScore
                }, req.ip);

                return res.status(200).json({
                    status: 'success',
                    message: 'تم حفظ درجة السؤال المقالي بنجاح.'
                });

            } catch (error) {
                return next(error);
            }
        });
    });
};