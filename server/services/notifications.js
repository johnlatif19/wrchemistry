const { db } = require('./firebase');

const createNotification = async (userId, title, message, type = 'info', link = null) => {
    const database = db();
    const notificationRef = database.collection('notifications').doc();
    
    await notificationRef.set({
        userId,
        title,
        message,
        type,
        link,
        isRead: false,
        createdAt: new Date().toISOString()
    });

    return notificationRef.id;
};

const getUserNotifications = async (userId, limit = 20) => {
    const database = db();
    const snapshot = await database
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

    const notifications = [];
    snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
    });

    return notifications;
};

const markAsRead = async (notificationId, userId) => {
    const database = db();
    const notificationRef = database.collection('notifications').doc(notificationId);
    const doc = await notificationRef.get();

    if (doc.exists && doc.data().userId === userId) {
        await notificationRef.update({ isRead: true });
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead
};