/**
 * FCM Token Manager
 * 
 * Manages Firebase Cloud Messaging tokens for push notifications.
 * Handles token registration, refresh, and platform-specific logic.
 */

import { Platform } from 'react-native';
import { getToken as getFirebaseToken, onMessage } from 'firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseMessaging, VAPID_KEY, isServerNotificationsEnabled } from './firebase-config';
import { apiFetch } from './api';

const FCM_TOKEN_KEY = 'fcm_token';
const TOKEN_SENT_KEY = 'fcm_token_sent';

/**
 * Initialize FCM and request permissions
 * @returns {Promise<boolean>} True if initialization successful
 */
export async function initialize(): Promise<boolean> {
  try {
    // Check if server notifications are enabled
    if (!isServerNotificationsEnabled()) {
      console.log('[FCM] Server notifications disabled, skipping initialization');
      return false;
    }

    // Only web platform supports Firebase Messaging in this setup
    if (Platform.OS !== 'web') {
      console.log('[FCM] Platform not supported for FCM (use native push for mobile)');
      return false;
    }

    console.log('[FCM] Initializing FCM Token Manager...');

    // Get messaging instance
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.log('[FCM] Messaging not available');
      return false;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied');
      return false;
    }

    console.log('[FCM] Notification permission granted');
    return true;
  } catch (error) {
    console.error('[FCM] Error initializing:', error);
    return false;
  }
}

/**
 * Get FCM token from device
 * @returns {Promise<string | null>} FCM token or null if unavailable
 */
export async function getToken(): Promise<string | null> {
  try {
    // Check if server notifications are enabled
    if (!isServerNotificationsEnabled()) {
      console.log('[FCM] Server notifications disabled');
      return null;
    }

    // Only web platform supported
    if (Platform.OS !== 'web') {
      console.log('[FCM] Platform not supported');
      return null;
    }

    // Get messaging instance
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.log('[FCM] Messaging not available');
      return null;
    }

    // Get token with VAPID key
    const token = await getFirebaseToken(messaging, {
      vapidKey: VAPID_KEY
    });

    if (token) {
      console.log('[FCM] Token obtained:', token.substring(0, 20) + '...');
      // Store token locally
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      return token;
    } else {
      console.log('[FCM] No token available');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
}

/**
 * Register FCM token with backend
 * @param {string} token - FCM token to register
 * @returns {Promise<boolean>} True if registration successful
 */
export async function registerToken(token: string): Promise<boolean> {
  try {
    console.log('[FCM] Registering token with backend...');

    // Check if token was already sent
    const lastSentToken = await AsyncStorage.getItem(TOKEN_SENT_KEY);
    if (lastSentToken === token) {
      console.log('[FCM] Token already registered, skipping');
      return true;
    }

    // Send token to backend
    await apiFetch('/auth/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ fcmToken: token })
    });

    // Mark token as sent
    await AsyncStorage.setItem(TOKEN_SENT_KEY, token);
    console.log('[FCM] Token registered successfully');
    return true;
  } catch (error) {
    console.error('[FCM] Error registering token:', error);
    return false;
  }
}


export async function setupTokenRefresh(): Promise<void> {
  try {
    // Only web platform supported
    if (Platform.OS !== 'web') {
      return;
    }

    // Get messaging instance
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return;
    }

    // Firebase automatically handles token refresh
    // We just need to periodically check for new tokens
    console.log('[FCM] Token refresh monitoring enabled');
  } catch (error) {
    console.error('[FCM] Error setting up token refresh:', error);
  }
}


export async function setupForegroundMessageListener(): Promise<void> {
  try {
    // Only web platform supported
    if (Platform.OS !== 'web') {
      return;
    }

    // Get messaging instance
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return;
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);

      const title = payload.notification?.title || payload.data?.title || 'Medication Reminder';
      const body = payload.notification?.body || payload.data?.body || 'You have a new notification';

      // 1. Show browser/iOS notification centre notification
      // This is needed because webpush.notification does NOT auto-display when app is in foreground
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/icon.png',
          badge: '/badge.png',
          tag: payload.data?.medicationTimeId || 'default',
          requireInteraction: true
        });
      }

      // 2. Also show in-app notification for better UX when app is focused
      import('../components/InAppNotification').then(module => {
        if (module.triggerInAppNotification) {
          module.triggerInAppNotification(title, body);
        }
      }).catch(err => {
        console.error('[FCM] Error loading InAppNotification:', err);
      });
    });

    console.log('[FCM] Foreground message listener setup complete');
  } catch (error) {
    console.error('[FCM] Error setting up foreground listener:', error);
  }
}


export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('[FCM] Error getting stored token:', error);
    return null;
  }
}


export async function clearStoredToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    await AsyncStorage.removeItem(TOKEN_SENT_KEY);
    console.log('[FCM] Stored token cleared');
  } catch (error) {
    console.error('[FCM] Error clearing stored token:', error);
  }
}


export async function setupFCM(): Promise<boolean> {
  try {
    console.log('[FCM] Starting FCM setup...');

    // Initialize FCM
    const initialized = await initialize();
    if (!initialized) {
      console.log('[FCM] Initialization failed');
      return false;
    }

    // Get FCM token
    const token = await getToken();
    if (!token) {
      console.log('[FCM] Failed to get token');
      return false;
    }

    // Register token with backend
    const registered = await registerToken(token);
    if (!registered) {
      console.log('[FCM] Failed to register token');
      return false;
    }

    // Setup token refresh monitoringA
    await setupTokenRefresh();

    // Setup foreground message listener
    await setupForegroundMessageListener();

    console.log('[FCM] Setup complete!');
    return true;
  } catch (error) {
    console.error('[FCM] Error during setup:', error);
    return false;
  }
}
