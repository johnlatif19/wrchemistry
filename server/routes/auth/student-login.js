const { auth, db } = require('../../services/firebase');
const { BadRequestError, UnauthorizedError } = require('../../utils/errors');
const { logAction } = require('../../services/audit-log');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new BadRequestError('البريد الإلكتروني وكلمة المرور مطلوبان.');
        }

        let userRecord;
        try {
            userRecord = await auth().getUserByEmail(email);
        } catch (error) {
            throw new UnauthorizedError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }

        const database = db();
        const userDoc = await database.collection('users').doc(userRecord.uid).get();
        
        if (!userDoc.exists || userDoc.data().role !== 'student') {
            throw new UnauthorizedError('هذا الحساب غير مصرح له بالدخول كطالب.');
        }

        const customToken = await auth().createCustomToken(userRecord.uid);

        await logAction('STUDENT_LOGIN', userRecord.uid, {}, req.ip);

        return res.status(200).json({
            status: 'success',
            message: 'تم تسجيل الدخول بنجاح.',
            data: { uid: userRecord.uid, token: customToken }
        });

    } catch (error) {
        return next(error);
    }
};
