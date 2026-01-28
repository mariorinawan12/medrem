
const { addMinutes, isBefore } = require('date-fns');
const { MedicationTime, Medication, User, MedicationRule } = require('../models');
const { sendNotification } = require('./pushNotificationService');
const { formatMainNotification, formatFollowUpNotification, formatGuardianAlertNotification } = require('../utils/notificationFormatter');

// Store active setTimeout jobs
const activeJobs = new Map();

function calculateReminderTimes(medicationRule, userSettings) {
  try {
    const { ruleTime } = medicationRule;
    const { followUpIntervalMinutes, followUpCount } = userSettings;

    // Parse rule time (format: "HH:mm:ss")
    const [hours, minutes] = ruleTime.split(':').map(Number);

    // Create reminder time for today in LOCAL time (not UTC)
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);

    // Calculate follow-up times
    const times = [reminderDate];
    for (let i = 1; i <= followUpCount; i++) {
      const followUpTime = addMinutes(reminderDate, i * followUpIntervalMinutes);
      times.push(followUpTime);
    }

    return times;
  } catch (error) {
    console.error('[Scheduler] Error calculating reminder times:', error);
    return [];
  }
}


async function scheduleMedicationNotifications(medicationId, userId) {
  try {
    console.log(`[Scheduler] Scheduling notifications for medication ${medicationId}, user ${userId}`);

    // Get medication details
    const medication = await Medication.findByPk(medicationId);
    if (!medication) {
      return { success: false, error: 'Medication not found' };
    }

    // Get user settings
    const user = await User.findByPk(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const userSettings = {
      followUpIntervalMinutes: user.followUpIntervalMinutes || 5,
      followUpCount: user.followUpCount || 1
    };

    // Get medication rules
    const rules = await MedicationRule.findAll({
      where: { medicationId, userId }
    });

    if (rules.length === 0) {
      console.log(`[Scheduler] No rules found for medication ${medicationId}`);
      return { success: true, scheduled: 0 };
    }

    let scheduledCount = 0;

    // Get all medication times for this medication that are not taken
    const medicationTimes = await MedicationTime.findAll({
      where: {
        medicationId,
        userId,
        medicationStatus: 'not-taken'
      }
    });

    // Schedule notification jobs for each medication time
    for (const medicationTime of medicationTimes) {
      await scheduleNotificationJob(medicationTime, medication, userSettings);
      scheduledCount++;
    }

    console.log(`[Scheduler] ✓ Scheduled ${scheduledCount} notifications for medication ${medicationId}`);

    return {
      success: true,
      scheduled: scheduledCount
    };

  } catch (error) {
    console.error('[Scheduler] Error scheduling medication notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


async function scheduleNotificationJob(medicationTime, medication, userSettings) {
  try {
    const { medicationTimeId, reminderTime, userId } = medicationTime;
    const { followUpIntervalMinutes, followUpCount } = userSettings;

    // Calculate when to send the notification
    const now = new Date();
    const reminderDate = new Date(reminderTime);

    // If reminder time is in the past, skip
    if (isBefore(reminderDate, now)) {
      console.log(`[Scheduler] Skipping past reminder for medication time ${medicationTimeId}`);
      return;
    }

    // Calculate delay in milliseconds
    const delay = reminderDate.getTime() - now.getTime();

    // Schedule main notification
    const jobKey = `main-${medicationTimeId}`;

    const mainJob = setTimeout(async () => {
      console.log(`[Scheduler] Sending main notification for medication time ${medicationTimeId}`);

      // Format notification content
      const notification = formatMainNotification(medication, reminderTime, medicationTimeId);

      const result = await sendNotification(userId, notification);

      if (result.success) {
        // Update medication time with notification ID
        await medicationTime.update({
          mainNotificationId: result.messageId
        });

        // Schedule follow-ups
        await scheduleFollowUps(medicationTime, medication, userSettings);
      }

      await scheduleGuardianAlert(medicationTime, medication, userId);

      // Remove job from active jobs
      activeJobs.delete(jobKey);
    }, delay);

    // Store job reference
    activeJobs.set(jobKey, mainJob);

    console.log(`[Scheduler] ✓ Scheduled main notification for ${reminderDate.toISOString()}`);

  } catch (error) {
    console.error('[Scheduler] Error scheduling notification job:', error);
  }
}


async function scheduleFollowUps(medicationTime, medication, userSettings) {
  try {
    const { medicationTimeId, reminderTime, userId } = medicationTime;
    const { followUpIntervalMinutes, followUpCount } = userSettings;

    const followUpIds = [];

    for (let i = 1; i <= followUpCount; i++) {
      const followUpTime = addMinutes(new Date(reminderTime), i * followUpIntervalMinutes);
      const now = new Date();

      // Skip if follow-up time is in the past
      if (isBefore(followUpTime, now)) {
        continue;
      }

      const delay = followUpTime.getTime() - now.getTime();
      const jobKey = `followup-${medicationTimeId}-${i}`;

      const followUpJob = setTimeout(async () => {
        // Check if medication was taken
        const updated = await MedicationTime.findByPk(medicationTimeId);
        if (updated && updated.medicationStatus === 'taken') {
          console.log(`[Scheduler] Skipping follow-up ${i} - medication already taken`);
          activeJobs.delete(jobKey);
          return;
        }

        console.log(`[Scheduler] Sending follow-up ${i} for medication time ${medicationTimeId}`);

        // Format follow-up notification content
        const notification = formatFollowUpNotification(medication, i, medicationTimeId);

        const result = await sendNotification(userId, notification);

        if (result.success) {
          followUpIds.push(result.messageId);
        }

        activeJobs.delete(jobKey);
      }, delay);

      activeJobs.set(jobKey, followUpJob);
      console.log(`[Scheduler] ✓ Scheduled follow-up ${i} for ${followUpTime.toISOString()}`);
    }

    // Update medication time with follow-up IDs
    if (followUpIds.length > 0) {
      await medicationTime.update({
        followUpNotificationIds: followUpIds
      });
    }

  } catch (error) {
    console.error('[Scheduler] Error scheduling follow-ups:', error);
  }
}


async function cancelFollowUps(medicationTimeId) {
  try {
    console.log(`[Scheduler] Cancelling follow-ups for medication time ${medicationTimeId}`);

    // Find and cancel all follow-up jobs for this medication time
    let cancelledCount = 0;

    for (const [jobKey, job] of activeJobs.entries()) {
      if (jobKey.startsWith(`followup-${medicationTimeId}-`)) {
        clearTimeout(job);
        activeJobs.delete(jobKey);
        cancelledCount++;
      }
    }

    console.log(`[Scheduler] ✓ Cancelled ${cancelledCount} follow-up notifications`);

    return {
      success: true,
      cancelled: cancelledCount
    };

  } catch (error) {
    console.error('[Scheduler] Error cancelling follow-ups:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


async function cancelAllJobs(medicationTimeId) {
  try {
    console.log(`[Scheduler] Cancelling ALL jobs for medication time ${medicationTimeId}`);

    let cancelledCount = 0;

    // Cancel main notification job
    const mainJobKey = `main-${medicationTimeId}`;
    if (activeJobs.has(mainJobKey)) {
      clearTimeout(activeJobs.get(mainJobKey));
      activeJobs.delete(mainJobKey);
      cancelledCount++;
      console.log(`[Scheduler] ✓ Cancelled main notification`);
    }

    // Cancel all follow-up jobs
    for (const [jobKey, job] of activeJobs.entries()) {
      if (jobKey.startsWith(`followup-${medicationTimeId}-`)) {
        clearTimeout(job);
        activeJobs.delete(jobKey);
        cancelledCount++;
      }
    }

    console.log(`[Scheduler] ✓ Cancelled ${cancelledCount} total jobs (main + follow-ups)`);

    return {
      success: true,
      cancelled: cancelledCount
    };

  } catch (error) {
    console.error('[Scheduler] Error cancelling all jobs:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


async function cancelMedicationJobs(medicationId, userId) {
  try {
    console.log(`[Scheduler] Cancelling ALL jobs for medication ${medicationId}`);

    // Get all medication times for this medication
    const medicationTimes = await MedicationTime.findAll({
      where: {
        medicationId,
        userId
      }
    });

    let totalCancelled = 0;

    // Cancel jobs for each medication time
    for (const medTime of medicationTimes) {
      const result = await cancelAllJobs(medTime.medicationTimeId);
      if (result.success) {
        totalCancelled += result.cancelled;
      }
    }

    console.log(`[Scheduler] ✓ Cancelled ${totalCancelled} total jobs for medication ${medicationId}`);

    return {
      success: true,
      cancelled: totalCancelled
    };

  } catch (error) {
    console.error('[Scheduler] Error cancelling medication jobs:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


async function rescheduleUserNotifications(userId) {
  try {
    console.log(`[Scheduler] Rescheduling all notifications for user ${userId}`);

    // Get all medication times for this user to find their job keys
    const medicationTimes = await MedicationTime.findAll({
      where: {
        userId,
        medicationStatus: 'not-taken'
      }
    });

    // Cancel all existing jobs for this user's medication times
    let cancelledCount = 0;
    for (const medTime of medicationTimes) {
      const medicationTimeId = medTime.medicationTimeId;

      // Cancel main job
      const mainJobKey = `main-${medicationTimeId}`;
      if (activeJobs.has(mainJobKey)) {
        clearTimeout(activeJobs.get(mainJobKey));
        activeJobs.delete(mainJobKey);
        cancelledCount++;
      }

      // Cancel all follow-up jobs
      for (const [jobKey, job] of activeJobs.entries()) {
        if (jobKey.startsWith(`followup-${medicationTimeId}-`)) {
          clearTimeout(job);
          activeJobs.delete(jobKey);
          cancelledCount++;
        }
      }
    }

    console.log(`[Scheduler] Cancelled ${cancelledCount} existing jobs`);

    // Get all medications for user
    const medications = await Medication.findAll({
      where: { userId }
    });

    let rescheduledCount = 0;

    for (const medication of medications) {
      const result = await scheduleMedicationNotifications(medication.medicationId, userId);
      if (result.success) {
        rescheduledCount += result.scheduled;
      }
    }

    console.log(`[Scheduler] ✓ Rescheduled ${rescheduledCount} notifications for user ${userId}`);

    return {
      success: true,
      rescheduled: rescheduledCount
    };

  } catch (error) {
    console.error('[Scheduler] Error rescheduling user notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}


async function loadPendingSchedules() {
  try {
    console.log('[Scheduler] Loading pending schedules from database...');

    // Get all future medication times that are not taken
    const now = new Date();
    const pendingTimes = await MedicationTime.findAll({
      where: {
        reminderTime: { [require('sequelize').Op.gt]: now },
        medicationStatus: 'not-taken'
      },
      include: [
        { model: Medication },
        { model: User }
      ]
    });

    let loadedCount = 0;

    for (const medicationTime of pendingTimes) {
      const userSettings = {
        followUpIntervalMinutes: medicationTime.User.followUpIntervalMinutes || 5,
        followUpCount: medicationTime.User.followUpCount || 1
      };

      await scheduleNotificationJob(medicationTime, medicationTime.Medication, userSettings);
      loadedCount++;
    }

    console.log(`[Scheduler] ✓ Loaded ${loadedCount} pending schedules`);

    return {
      success: true,
      loaded: loadedCount
    };

  } catch (error) {
    console.error('[Scheduler] Error loading pending schedules:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// GUARDIAN ALERT FEATURE (ADD-ON)
// Notifies main user when dependent hasn't taken medication
// ============================================


const GUARDIAN_ALERT_DELAY_MINUTES = 10;


async function scheduleGuardianAlert(medicationTime, medication, userId) {
  try {
    const { medicationTimeId, reminderTime } = medicationTime;

    // 1. Get user (dependent)
    const dependent = await User.findByPk(userId);
    if (!dependent) {
      console.log(`[Guardian] User ${userId} not found, skipping guardian alert`);
      return;
    }

    // 2. Check if user is a dependent with a parent
    if (dependent.role !== 'dependent_user' || !dependent.parentId) {
      console.log(`[Guardian] User ${userId} is not a dependent or has no parent, skipping`);
      return;
    }

    // 3. Get parent user (main user / guardian)
    const parent = await User.findByPk(dependent.parentId);
    if (!parent) {
      console.log(`[Guardian] Parent ${dependent.parentId} not found, skipping guardian alert`);
      return;
    }

    // 4. Calculate when to send guardian alert
    const alertTime = addMinutes(new Date(reminderTime), GUARDIAN_ALERT_DELAY_MINUTES);
    const now = new Date();

    // Skip if alert time is in the past
    if (isBefore(alertTime, now)) {
      console.log(`[Guardian] Alert time is in the past for medication time ${medicationTimeId}, skipping`);
      return;
    }

    const delay = alertTime.getTime() - now.getTime();
    const jobKey = `guardian-${medicationTimeId}`;

    // 5. Schedule the guardian alert job
    const guardianJob = setTimeout(async () => {
      try {
        // Check if medication was taken
        const updated = await MedicationTime.findByPk(medicationTimeId);
        if (!updated || updated.medicationStatus === 'taken') {
          console.log(`[Guardian] Medication ${medicationTimeId} already taken, skipping guardian alert`);
          activeJobs.delete(jobKey);
          return;
        }

        console.log(`[Guardian] Sending guardian alert to parent ${parent.userId} for dependent ${dependent.fullName}`);

        // Format and send notification to parent
        const notification = formatGuardianAlertNotification(
          medication,
          dependent,
          GUARDIAN_ALERT_DELAY_MINUTES,
          medicationTimeId
        );

        const result = await sendNotification(parent.userId, notification);

        if (result.success) {
          console.log(`[Guardian] ✓ Guardian alert sent to parent ${parent.userId}`);
        } else {
          console.log(`[Guardian] ✗ Failed to send guardian alert: ${result.error}`);
        }

        activeJobs.delete(jobKey);
      } catch (error) {
        console.error('[Guardian] Error in guardian alert job:', error);
        activeJobs.delete(jobKey);
      }
    }, delay);

    // Store job reference
    activeJobs.set(jobKey, guardianJob);
    console.log(`[Guardian] ✓ Scheduled guardian alert for ${alertTime.toISOString()} (${GUARDIAN_ALERT_DELAY_MINUTES} min after reminder)`);

  } catch (error) {
    console.error('[Guardian] Error scheduling guardian alert:', error);
  }
}


function cancelGuardianAlert(medicationTimeId) {
  const jobKey = `guardian-${medicationTimeId}`;
  if (activeJobs.has(jobKey)) {
    clearTimeout(activeJobs.get(jobKey));
    activeJobs.delete(jobKey);
    console.log(`[Guardian] ✓ Cancelled guardian alert for medication time ${medicationTimeId}`);
  }
}

module.exports = {
  calculateReminderTimes,
  scheduleMedicationNotifications,
  cancelFollowUps,
  cancelAllJobs,
  cancelMedicationJobs,
  rescheduleUserNotifications,
  loadPendingSchedules,
  // Guardian alert add-on
  scheduleGuardianAlert,
  cancelGuardianAlert,
  GUARDIAN_ALERT_DELAY_MINUTES
};
