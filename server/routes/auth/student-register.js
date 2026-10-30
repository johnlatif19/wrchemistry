const { auth, db } = require('../../services/firebase');
const { BadRequestError, ConflictError } = require('../../utils/errors');
const { isValidEmail, isValidPhone } = require('../../utils/sanitize');
const { logAction } = require('../../services/audit-log');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { fullName, email, phone, studentCode, password } = req.body;

        if (!fullName || !email || !phone || !studentCode || !password) {
            throw new BadRequestError('جميع الحقول مطلوبة.');
        }

        if (!isValidEmail(email)) {
            throw new BadRequestError('البريد الإلكتروني غير صالح.');
        }

        if (!isValidPhone(phone)) {
            throw new BadRequestError('رقم الهاتف غير صالح.');
        }

        if (password.length < 8) {
            throw new BadRequestError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
        }

        const database = db();
        
        const existingCode = await database.collection('users').where('studentCode', '==', studentCode).limit(1).get();
        if (!existingCode.empty) {
            throw new ConflictError('كود الطالب مسجل بالفعل.');
        }

        const userRecord = await auth().createUser({
            email,
            password,
            displayName: fullName
        });

        await database.collection('users').doc(userRecord.uid).set({
            fullName,
            email,
            phone,
            studentCode,
            role: 'student',
            createdAt: new Date().toISOString()
        });

        const customToken = await auth().createCustomToken(userRecord.uid);

        await logAction('STUDENT_REGISTERED', userRecord.uid, { email }, req.ip);

        return res.status(201).json({
            status: 'success',
            message: 'تم إنشاء الحساب بنجاح.',
            data: { uid: userRecord.uid, token: customToken }
        });

    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            return next(new ConflictError('البريد الإلكتروني مستخدم بالفعل.'));
        }
        return next(error);
    }
};