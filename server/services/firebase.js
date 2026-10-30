const admin = require('firebase-admin');
const config = require('../config/environment');

let app;

function initFirebaseAdmin() {
    if (app) return app;

    try {
        const serviceAccount = JSON.parse(config.firebase.config);
        
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });

        return app;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error.message);
        process.exit(1);
    }
}

const db = () => {
    if (!app) initFirebaseAdmin();
    return admin.firestore();
};

const auth = () => {
    if (!app) initFirebaseAdmin();
    return admin.auth();
};

const verifyIdToken = async (idToken) => {
    if (!app) initFirebaseAdmin();
    try {
        return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

const setAdminClaim = async (uid) => {
    if (!app) initFirebaseAdmin();
    await admin.auth().setCustomUserClaims(uid, { admin: true });
};

module.exports = {
    initFirebaseAdmin,
    db,
    auth,
    verifyIdToken,
    setAdminClaim
};