const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let firebaseApp = null;
let firebaseAuth = null;
let googleProvider = null;
let facebookProvider = null;

function initFirebaseClient() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded');
        return;
    }

    if (!firebaseApp) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        facebookProvider = new firebase.auth.FacebookAuthProvider();
    }
}

async function signInWithGoogle() {
    initFirebaseClient();
    try {
        const result = await firebaseAuth.signInWithPopup(googleProvider);
        return result.user;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function signInWithFacebook() {
    initFirebaseClient();
    try {
        const result = await firebaseAuth.signInWithPopup(facebookProvider);
        return result.user;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getCurrentUserToken() {
    initFirebaseClient();
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
}