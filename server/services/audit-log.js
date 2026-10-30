const { db } = require('./firebase');

const logAction = async (action, userId, details = {}, ipAddress = null) => {
    try {
        const database = db();
        await database.collection('auditLogs').add({
            action,
            userId: userId || 'anonymous',
            details,
            ipAddress,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to write audit log:', error.message);
    }
};

module.exports = { logAction };