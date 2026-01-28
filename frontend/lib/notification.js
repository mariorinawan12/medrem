import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { updateFcmToken } from './auth';

// Set notification handler to show notifications when app is foregrounded (iOS & Android)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Register Expo Push Notification token and send to backend
 * @returns {Promise<string|null>} The Expo push token or null if failed
 */
export async function registerExpoPushToken() {
  try {
    // if (!Constants.isDevice) {
    //   console.log('Must use physical device for Push Notifications');
    //   return null;
    // }

    // Request permissions with the Notifications API (no more expo-permissions)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted!');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync(
        {
            projectId: '5945192b-2ae0-4b2f-846c-97bc6b9edf90'
        }
    );
    const expoPushToken = tokenData.data;

    if (expoPushToken) {
      // Send token to your backend
      await updateFcmToken(expoPushToken);
      console.log('Expo push token registered:', expoPushToken);
    }

    // On Android, we need to set the notification channel for sound and importance
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return expoPushToken;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}
