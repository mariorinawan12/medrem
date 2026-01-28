/**
 * Firebase Configuration for Frontend
 * 
 * This file contains the Firebase configuration for web, Android, and iOS platforms.
 * It initializes the Firebase app and exports configuration for FCM.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

// Firebase configuration object
// Configuration from Firebase Console for medication-reminder-app-8eb54
export const firebaseConfig = {
  apiKey: "AIzaSyABN2CXXPOQzm6-cStv3jtL4udns9u2ECU",
  authDomain: "medication-reminder-app-8eb54.firebaseapp.com",
  projectId: "medication-reminder-app-8eb54",
  storageBucket: "medication-reminder-app-8eb54.firebasestorage.app",
  messagingSenderId: "913664698786",
  appId: "1:913664698786:web:6f62b9c191d07ab994aafb",
  measurementId: "G-CR78N703QD"
};

// VAPID key for web push notifications
// Generate this in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
export const VAPID_KEY = "BCnibayF3CMPqqNBrHXLGclWvjtJBumPRiTud_JAbCU8R_M0wmeR8h84RXGqpPxNeDvi-t3AZlGg9BLoO3eIOD0";

// Feature flags for notification system
export const USE_LOCAL_NOTIFICATIONS = false;  // Set to false to disable local notifications (using FCM now)
export const USE_SERVER_NOTIFICATIONS = true;  // Set to true when enabling FCM

// Initialize Firebase app (only once)
let firebaseApp: FirebaseApp;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app
 * @returns {FirebaseApp} Firebase app instance
 */
export function initializeFirebase(): FirebaseApp {
  if (!firebaseApp) {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }
  }
  return firebaseApp;
}

/**
 * Get Firebase Messaging instance
 * Only works on web platform
 * @returns {Promise<Messaging | null>} Messaging instance or null if not supported
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messaging) {
    return messaging;
  }

  try {
    // Check if messaging is supported (web only)
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.log('[Firebase] Messaging not supported on this platform');
      return null;
    }

    // Initialize Firebase app first
    const app = initializeFirebase();
    
    // Get messaging instance
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('[Firebase] Error initializing messaging:', error);
    return null;
  }
}

/**
 * Validate Firebase configuration
 * @returns {boolean} True if configuration is valid
 */
export function isFirebaseConfigured(): boolean {
  return (
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId === "medication-reminder-app-8eb54" &&
    firebaseConfig.appId !== "YOUR_APP_ID"
  );
}

/**
 * Check if server-side notifications are enabled
 * @returns {boolean}
 */
export function isServerNotificationsEnabled(): boolean {
  return USE_SERVER_NOTIFICATIONS;
}

/**
 * Check if local notifications are enabled
 * @returns {boolean}
 */
export function isLocalNotificationsEnabled(): boolean {
  return USE_LOCAL_NOTIFICATIONS;
}
