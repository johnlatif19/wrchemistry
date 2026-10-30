const { authenticateAdmin } = require('/../../middleware/authentication');
const { isAdmin } = require('/../../middleware/authorization');
const { getIncidents } = require('/../../services/cheating');

module.exports = async (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    authenticateAdmin(req, res, (err) => {
        if (err) return next(err);

        isAdmin(req, res, async (authErr) => {
            if (authErr) return next(authErr);

            try {
                const { assignmentId, studentId, status } = req.query;

                const filters = {};
                if (assignmentId) filters.assignmentId = assignmentId;
                if (studentId) filters.studentId = studentId;
                if (status) filters.status = status;

                const incidents = await getIncidents(filters);

                return res.status(200).json({
                    status: 'success',
                    results: incidents.length,
                    data: incidents
                });

            } catch (error) {
                return next(error);
            }
        });
    });
};