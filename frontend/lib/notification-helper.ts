import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { updateMedicationNotificationId } from './medication';
import { fetchNotificationSettings } from './medication';
import { isLocalNotificationsEnabled } from './firebase-config';

// Import in-app notification for web
let triggerInAppNotification: ((title: string, body: string) => void) | null = null;
let isModuleReady = false;
const moduleReadyCallbacks: (() => void)[] = [];

if (Platform.OS === 'web') {
  // Dynamically import to avoid issues on mobile
  import('../components/InAppNotification').then(module => {
    triggerInAppNotification = module.triggerInAppNotification;
    isModuleReady = true;
    console.log('[NOTIF HELPER] In-app notification module loaded and ready');
    
    // Execute all pending callbacks
    moduleReadyCallbacks.forEach(callback => callback());
    moduleReadyCallbacks.length = 0;
  });
}

// Helper to wait for module to be ready
function waitForModule(): Promise<void> {
  if (isModuleReady) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    moduleReadyCallbacks.push(resolve);
  });
}

// Store scheduled timeouts for web notifications
const scheduledNotifications = new Map<string, number[]>();


export async function registerForNotifications() {
  if (Platform.OS === 'web') {
    // For web (including iOS PWA), request browser notification permission
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log("Web Notifications: Permission granted");
          return true;
        } else {
          console.warn("Web Notifications: Permission denied or dismissed");
          return false;
        }
      } catch (error) {
        console.error("Web Notifications: Error requesting permission", error);
        return false;
      }
    } else {
      console.warn("Web Notifications: Not supported in this browser");
      return false;
    }
  }
 
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn("Notifications: Permission not granted.");
    return false;
  }

  console.log("Notifications: Permission granted.");
  return true;
}

// export async function scheduleMedicationNotifications(medicationTimes: any[]) {
//   console.log("Notifications: Canceling all previous scheduled notifications...");
//   await Notifications.cancelAllScheduledNotificationsAsync();

//   const now = new Date();

//   for (const med of medicationTimes) {
//     const triggerTime = new Date(med.reminderTime);

//     if (triggerTime > now) {
//       // Main notification
//       const mainId = await Notifications.scheduleNotificationAsync({
//         content: {
//           title: `Time to take ${med.name}`,
//           body: `Scheduled at ${triggerTime.toLocaleTimeString()}`,
//         },
//         trigger: triggerTime as any,
//       });

//       console.log(`Scheduled "${med.name}" main notification at ${triggerTime.toISOString()} with ID: ${mainId}`);

//       // Follow-up notification (5 minutes later)
//       const followUpTime = new Date(triggerTime.getTime() + 5 * 60000); // 5 minutes later
//       const followUpId = await Notifications.scheduleNotificationAsync({
//         content: {
//           title: `Still need to take ${med.name}?`,
//           body: `This is a follow-up reminder.`,
//         },
//         trigger: followUpTime as any,
//       });

//       console.log(`Scheduled follow-up for "${med.name}" at ${followUpTime.toISOString()} with ID: ${followUpId}`);

//       // 🔁 Update DB (e.g., through API call)
//       try {
//         await updateMedicationNotificationId(med.medicationTimeId, mainId, followUpId);
//         console.log(`Updated DB for "${med.name}" with notification IDs.`);
//       } catch (err) {
//         console.error("Failed to update notification IDs in DB:", err);
//       }
//     } else {
//       console.log(`Skipping past reminder for "${med.name}" at ${triggerTime.toISOString()}`);
//     }
//   }
// }

export async function scheduleMedicationNotifications(medicationTimes: any[]) {
  // Kill switch: Check if local notifications are enabled
  if (!isLocalNotificationsEnabled()) {
    console.log('[KILL SWITCH] Local notifications are disabled. Skipping scheduling.');
    // Clear any existing scheduled notifications
    await clearAllMedicationNotifications();
    return;
  }

  if (Platform.OS === 'web') {
    // Wait for module to be ready first
    await waitForModule();
    
    // Web in-app notification scheduling
    console.log("Web In-App Notifications: Clearing all previous scheduled notifications...");
    clearAllMedicationNotifications();

    const now = new Date();
    const settings = await fetchNotificationSettings();
    const { followUpIntervalMinutes, followUpCount } = settings;
    
    // Maximum delay for setTimeout (24 days to be safe, limit is ~24.8 days)
    const MAX_DELAY_MS = 24 * 24 * 60 * 60 * 1000; // 24 days in milliseconds

    for (const med of medicationTimes) {
      const triggerTime = new Date(med.reminderTime);

      console.log(`[SCHEDULE] Med: ${med.name}`);
      console.log(`[SCHEDULE] Now: ${now.toISOString()}`);
      console.log(`[SCHEDULE] Trigger time: ${triggerTime.toISOString()}`);

      if (triggerTime > now) {
        const delay = triggerTime.getTime() - now.getTime();
        
        // Check if delay exceeds setTimeout limit
        if (delay > MAX_DELAY_MS) {
          console.log(`[SCHEDULE] Skipping "${med.name}" - delay too large (${Math.round(delay / 86400000)} days, max 24 days for web demo)`);
          continue;
        }
        
        const timeouts: number[] = [];

        console.log(`[SCHEDULE] Delay: ${delay}ms (${Math.round(delay / 1000)} seconds)`);
        console.log(`[SCHEDULE] Setting timeout at: ${new Date().toISOString()}`);
        console.log(`[SCHEDULE] Expected fire time: ${triggerTime.toISOString()}`);

        // TEST: Simple setTimeout to verify it works
        const testStart = Date.now();
        
        // Schedule main notification
        const mainTimeout = window.setTimeout(() => {
          const actualDelay = Date.now() - testStart;
          console.log(`[FIRED] Main notification for "${med.name}" at ${new Date().toISOString()}`);
          console.log(`[FIRED] Expected delay: ${delay}ms, Actual delay: ${actualDelay}ms`);
          
          if (triggerInAppNotification) {
            triggerInAppNotification(
              `Time to take ${med.name}`,
              `Scheduled at ${triggerTime.toLocaleTimeString()}`
            );
          }
        }, delay);

        timeouts.push(mainTimeout);
        console.log(`[SCHEDULE] Main notification timeout ID: ${mainTimeout}`);

        // Schedule follow-up notifications
        const followUpIds: string[] = [];
        for (let i = 1; i <= followUpCount; i++) {
          const followUpDelay = delay + (i * followUpIntervalMinutes * 60000);
          const followUpTestStart = Date.now();
          
          const followUpTimeout = window.setTimeout(() => {
            const actualFollowUpDelay = Date.now() - followUpTestStart;
            console.log(`[FIRED] Follow-up ${i} for "${med.name}" at ${new Date().toISOString()}`);
            console.log(`[FIRED] Expected delay: ${followUpDelay}ms, Actual delay: ${actualFollowUpDelay}ms`);
            
            if (triggerInAppNotification) {
              triggerInAppNotification(
                `Still need to take ${med.name}?`,
                `This is follow-up reminder ${i}.`
              );
            }
          }, followUpDelay);

          timeouts.push(followUpTimeout);
          followUpIds.push(`web-${med.medicationTimeId}-followup-${i}`);
          console.log(`[SCHEDULE] Follow-up ${i} timeout ID: ${followUpTimeout}`);
        }

        scheduledNotifications.set(med.medicationTimeId, timeouts);

        // Update DB with notification IDs (web-specific IDs)
        try {
          await updateMedicationNotificationId(
            med.medicationTimeId,
            `web-${med.medicationTimeId}-main`,
            followUpIds
          );
          console.log(`Updated DB for "${med.name}" with web notification IDs.`);
        } catch (err) {
          console.error("Failed to update notification IDs in DB:", err);
        }
      } else {
        console.log(`Skipping past reminder for "${med.name}" at ${triggerTime.toISOString()}`);
      }
    }
    return;
  }

  // Mobile notification scheduling (Expo)
  console.log("Notifications: Canceling all previous scheduled notifications...");
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  // 🔁 Fetch settings from backend
  const settings = await fetchNotificationSettings();
  const { followUpIntervalMinutes, followUpCount } = settings;

  for (const med of medicationTimes) {
    const triggerTime = new Date(med.reminderTime);

    if (triggerTime > now) {
      // 📌 Schedule main notification
      const mainId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time to take ${med.name}`,
          body: `Scheduled at ${triggerTime.toLocaleTimeString()}`,
        },
        trigger: triggerTime as any,
      });

      console.log(`Scheduled main notification for "${med.name}" at ${triggerTime.toISOString()} with ID: ${mainId}`);

      // 🔁 Schedule follow-up notifications based on settings
      const followUpIds: string[] = [];

      for (let i = 1; i <= followUpCount; i++) {
        const followUpTime = new Date(triggerTime.getTime() + i * followUpIntervalMinutes * 60000);

        const followUpId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Still need to take ${med.name}?`,
            body: `This is follow-up reminder ${i}.`,
          },
          trigger: followUpTime as any,
        });

        followUpIds.push(followUpId);
        console.log(`Scheduled follow-up ${i} for "${med.name}" at ${followUpTime.toISOString()} with ID: ${followUpId}`);
      }

      // 🔄 Update DB with notification IDs
      try {
        await updateMedicationNotificationId(
          med.medicationTimeId,
          mainId,
          followUpIds
        );
        console.log(`Updated DB for "${med.name}" with notification IDs.`);
      } catch (err) {
        console.error("Failed to update notification IDs in DB:", err);
      }

    } else {
      console.log(`Skipping past reminder for "${med.name}" at ${triggerTime.toISOString()}`);
    }
  }
}

export function useNotificationListener() {
  useEffect(() => {
    // Called when a notification is received while the app is in foreground
    const subscriptionReceived = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Called when a user interacts with a notification (tap, dismiss)
    const subscriptionResponse = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      subscriptionReceived.remove();
      subscriptionResponse.remove();
    };
  }, []);
}

export async function clearAllMedicationNotifications() {
  if (Platform.OS === 'web') {
    console.log("Web Notifications: Clearing all scheduled notifications...");
    
    scheduledNotifications.forEach((timeouts) => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    });
    
    scheduledNotifications.clear();
    console.log("Web Notifications: All scheduled notifications cleared.");
    return;
  }

  console.log("Notifications: Clearing all scheduled notifications...");
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("Notifications: All scheduled notifications cleared.");
}

export async function cancelScheduledNotification(notificationId: string) {
  if (Platform.OS === 'web') {
    // For web, extract medicationTimeId from the notification ID
    // Format: "web-{medicationTimeId}-main" or "web-{medicationTimeId}-followup-{i}"
    const match = notificationId.match(/web-(\d+)-/);
    if (match) {
      const medicationTimeId = match[1];
      const timeouts = scheduledNotifications.get(medicationTimeId);
      if (timeouts) {
        timeouts.forEach(timeout => clearTimeout(timeout));
        scheduledNotifications.delete(medicationTimeId);
        console.log(`Web: Cancelled notifications for medication ${medicationTimeId}`);
      }
    }
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function triggerTestNotification() {
  if (Platform.OS === 'web') {
    await waitForModule();
    
    setTimeout(() => {
      if (triggerInAppNotification) {
        triggerInAppNotification("Test Notification", "This is a test in-app notification.");
      }
    }, 1000);
    console.log("Web In-App Notifications: Test notification scheduled.");
    return;
  }

  const triggerTime = new Date(Date.now() + 5000); // 5 seconds from now
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification",
      body: "This is a test notification.",
    },
    trigger: triggerTime as any,
  });
  console.log("Notifications: Test notification scheduled.");
}

