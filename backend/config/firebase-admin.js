require("dotenv").config();
const admin = require("firebase-admin");

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * This should be called once when the server starts
 */
function initializeFirebaseAdmin() {
  if (firebaseApp) {
    console.log("Firebase Admin SDK already initialized");
    return firebaseApp;
  }

  try {
    // Check if all required environment variables are present
    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_PRIVATE_KEY ||
      !process.env.FIREBASE_CLIENT_EMAIL
    ) {
      console.warn(
        "Firebase Admin SDK not initialized: Missing configuration. " +
        "Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in your .env file."
      );
      return null;
    }

    // Initialize Firebase with environment variables
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    console.log("Firebase Admin SDK initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error.message);
    return null;
  }
}

/**
 * Get Firebase Messaging instance
 * @returns {admin.messaging.Messaging | null}
 */
function getMessaging() {
  if (!firebaseApp) {
    console.error("Firebase Admin SDK not initialized. Call initializeFirebaseAdmin() first.");
    return null;
  }

  return admin.messaging();
}

/**
 * Check if Firebase is initialized
 * @returns {boolean}
 */
function isFirebaseInitialized() {
  return firebaseApp !== null;
}

module.exports = {
  initializeFirebaseAdmin,
  getMessaging,
  isFirebaseInitialized,
  admin,
};
