const { auth } = require('/../../services/firebase');
const { BadRequestError } = require('/../../utils/errors');
const { isValidEmail } = require('/../../utils/sanitize');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email } = req.body;

        if (!email || !isValidEmail(email)) {
            throw new BadRequestError('البريد الإلكتروني غير صالح.');
        }

        const resetLink = await auth().generatePasswordResetLink(email);

        return res.status(200).json({
            status: 'success',
            message: 'تم إرسال رابط إعادة تعيين كلمة المرور بنجاح.',
            resetLink
        });

    } catch (error) {
        return res.status(200).json({
            status: 'success',
            message: 'إذا كان البريد مسجلاً، سيتم إرسال رابط الاستعادة.'
        });
    }
};