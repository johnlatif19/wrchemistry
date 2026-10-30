const { authenticateStudent } = require('/../../middleware/authentication');
const { generateUploadSignature } = require('/../../services/cloudinary');
const { BadRequestError } = require('/../../utils/errors');
const { validateFile } = require('/../../utils/validate-file');
const config = require('/../../config/environment');

module.exports = async (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateStudent(req, res, async (err) => {
        if (err) return next(err);

        try {
            const { fileType, fileSize, folderType } = req.body;

            if (!fileType || !fileSize) {
                throw new BadRequestError('بيانات الملف غير مكتملة.');
            }

            const dummyFile = {
                mimetype: fileType,
                size: fileSize
            };

            const validation = validateFile(dummyFile);
            if (!validation.isValid) {
                throw new BadRequestError(validation.message);
            }

            let targetFolder = 'wrchemistry/submissions';
            if (folderType === 'assignment') {
                targetFolder = 'wrchemistry/assignments';
            } else if (folderType === 'essay') {
                targetFolder = 'wrchemistry/essays';
            }

            const signatureData = generateUploadSignature(targetFolder);

            return res.status(200).json({
                status: 'success',
                data: {
                    signature: signatureData.signature,
                    timestamp: signatureData.timestamp,
                    folder: signatureData.folder,
                    apiKey: signatureData.apiKey,
                    cloudName: signatureData.cloudName
                }
            });

        } catch (error) {
            return next(error);
        }
    });
};