const { db } = require('./firebase');

const logIncident = async (data) => {
    const database = db();
    
    const incidentRef = database.collection('cheatingIncidents').doc();
    const incident = {
        studentId: data.studentId,
        studentName: data.studentName || 'غير معروف',
        assignmentId: data.assignmentId,
        attemptId: data.attemptId,
        incidentType: data.incidentType,
        timestamp: new Date().toISOString(),
        status: 'unresolved',
        metadata: data.metadata || {}
    };

    await incidentRef.set(incident);

    await database.collection('auditLogs').add({
        action: 'CHEATING_INCIDENT_LOGGED',
        incidentId: incidentRef.id,
        studentId: data.studentId,
        timestamp: new Date().toISOString()
    });

    return incidentRef.id;
};

const getIncidents = async (filters = {}) => {
    const database = db();
    let query = database.collection('cheatingIncidents').orderBy('timestamp', 'desc');

    if (filters.assignmentId) {
        query = query.where('assignmentId', '==', filters.assignmentId);
    }
    if (filters.studentId) {
        query = query.where('studentId', '==', filters.studentId);
    }
    if (filters.status) {
        query = query.where('status', '==', filters.status);
    }

    const snapshot = await query.limit(100).get();
    const incidents = [];
    snapshot.forEach(doc => {
        incidents.push({ id: doc.id, ...doc.data() });
    });

    return incidents;
};

const resolveIncident = async (incidentId, adminUsername) => {
    const database = db();
    await database.collection('cheatingIncidents').doc(incidentId).update({
        status: 'resolved',
        resolvedBy: adminUsername,
        resolvedAt: new Date().toISOString()
    });
};

module.exports = {
    logIncident,
    getIncidents,
    resolveIncident
};