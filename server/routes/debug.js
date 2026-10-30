const express = require('express');
const config = require('../config/environment');
const { initFirebaseAdmin } = require('../services/firebase');

module.exports = async (req, res) => {
    try {
        const firebaseConfig = JSON.parse(config.firebase.config);
        const debugInfo = {
            hasFirebaseConfig: !!config.firebase.config,
            firebaseConfigKeys: Object.keys(firebaseConfig),
            projectId: firebaseConfig.project_id,
            hasPrivateKey: !!firebaseConfig.private_key,
            privateKeyPrefix: firebaseConfig.private_key ? firebaseConfig.private_key.substring(0, 30) : null,
            hasClientEmail: !!firebaseConfig.client_email,
            clientEmail: firebaseConfig.client_email,
            hasAdminUsername: !!config.admin.username,
            hasAdminPasswordHash: !!config.admin.passwordHash,
            hasJwtSecret: !!config.jwt.secret
        };

        try {
            initFirebaseAdmin();
            debugInfo.firebaseInitialized = true;
        } catch (err) {
            debugInfo.firebaseInitialized = false;
            debugInfo.firebaseInitError = err.message;
        }

        res.json({ status: 'success', data: debugInfo });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
