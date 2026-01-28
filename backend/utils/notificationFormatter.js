/**
 * Notification Content Formatter
 * 
 * Formats notification content for medication reminders
 */

const { format } = require('date-fns');

/**
 * Format main notification content
 * @param {Object} medication - Medication object
 * @param {Date} reminderTime - Reminder time
 * @param {number} medicationTimeId - Medication time ID
 * @returns {Object} Formatted notification object
 */
function formatMainNotification(medication, reminderTime, medicationTimeId) {
  const timeStr = format(new Date(reminderTime), 'HH:mm');

  return {
    title: `Time to take ${medication.name}`,
    body: `${medication.dosage} ${medication.medicationForm} scheduled at ${timeStr}`,
    data: {
      medicationTimeId: medicationTimeId.toString(),
      medicationId: medication.medicationId.toString(),
      medicationName: medication.name,
      type: 'main',
      reminderTime: reminderTime.toISOString()
    }
  };
}

/**
 * Format follow-up notification content
 * @param {Object} medication - Medication object
 * @param {number} followUpNumber - Follow-up number (1, 2, 3, etc.)
 * @param {number} medicationTimeId - Medication time ID
 * @returns {Object} Formatted notification object
 */
function formatFollowUpNotification(medication, followUpNumber, medicationTimeId) {
  const titles = [
    `Reminder: ${medication.name}`,
    `Don't forget: ${medication.name}`,
    `Still need to take ${medication.name}?`,
    `Important: ${medication.name}`
  ];

  const bodies = [
    `This is follow-up reminder #${followUpNumber}. Please take your medication.`,
    `You haven't taken your ${medication.dosage} ${medication.medicationForm} yet.`,
    `Reminder #${followUpNumber}: Time to take your medication.`,
    `Please don't forget to take ${medication.dosage} ${medication.medicationForm}.`
  ];

  // Use different messages for variety
  const titleIndex = (followUpNumber - 1) % titles.length;
  const bodyIndex = (followUpNumber - 1) % bodies.length;

  return {
    title: titles[titleIndex],
    body: bodies[bodyIndex],
    data: {
      medicationTimeId: medicationTimeId.toString(),
      medicationId: medication.medicationId.toString(),
      medicationName: medication.name,
      type: 'followup',
      followUpNumber: followUpNumber.toString()
    }
  };
}

/**
 * Format late notification content
 * @param {Object} medication - Medication object
 * @param {Date} originalTime - Original reminder time
 * @param {number} medicationTimeId - Medication time ID
 * @returns {Object} Formatted notification object
 */
function formatLateNotification(medication, originalTime, medicationTimeId) {
  const timeStr = format(new Date(originalTime), 'HH:mm');

  return {
    title: `Missed: ${medication.name}`,
    body: `You missed your ${medication.dosage} ${medication.medicationForm} scheduled at ${timeStr}`,
    data: {
      medicationTimeId: medicationTimeId.toString(),
      medicationId: medication.medicationId.toString(),
      medicationName: medication.name,
      type: 'late',
      originalTime: originalTime.toISOString()
    }
  };
}

/**
 * Format stock low notification content
 * @param {Object} medication - Medication object
 * @param {number} remainingStock - Remaining stock quantity
 * @returns {Object} Formatted notification object
 */
function formatStockLowNotification(medication, remainingStock) {
  return {
    title: `Low Stock: ${medication.name}`,
    body: `Only ${remainingStock} ${medication.medicationForm} remaining. Time to refill!`,
    data: {
      medicationId: medication.medicationId.toString(),
      medicationName: medication.name,
      type: 'stock_low',
      remainingStock: remainingStock.toString()
    }
  };
}

/**
 * Format guardian alert notification content
 * Sent to main user (parent) when dependent hasn't taken medication
 * @param {Object} medication - Medication object
 * @param {Object} dependent - Dependent user object
 * @param {number} minutesLate - Minutes since reminder
 * @param {number} medicationTimeId - Medication time ID
 * @returns {Object} Formatted notification object
 */
function formatGuardianAlertNotification(medication, dependent, minutesLate, medicationTimeId) {
  return {
    title: `⚠️ ${dependent.fullName} belum minum obat`,
    body: `${medication.name} (${medication.dosage}) sudah ${minutesLate} menit belum diminum`,
    data: {
      medicationTimeId: medicationTimeId.toString(),
      medicationId: medication.medicationId.toString(),
      medicationName: medication.name,
      dependentId: dependent.userId.toString(),
      dependentName: dependent.fullName,
      type: 'guardian_alert',
      minutesLate: minutesLate.toString()
    }
  };
}

module.exports = {
  formatMainNotification,
  formatFollowUpNotification,
  formatLateNotification,
  formatStockLowNotification,
  formatGuardianAlertNotification
};
