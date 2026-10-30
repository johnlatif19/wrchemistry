module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    return res.status(200).json({
        status: 'success',
        message: 'تم تسجيل الخروج بنجاح.'
    });
};