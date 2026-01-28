const db = require("../models");
const { get } = require("../routes/dependent");
const { scheduleMedicationNotifications, cancelFollowUps, cancelAllJobs, cancelMedicationJobs, rescheduleUserNotifications, cancelGuardianAlert } = require("./notificationSchedulerService");
const Medication = db.Medication;
const MedicationTime = db.MedicationTime;
const MedicationLog = db.MedicationLog;
const MedicationRule = db.MedicationRule;
const User = db.User;


const isChildOf = async (parentId, childId) => {
  const child = await User.findOne({
    where: {
      userId: childId,
      parentId: parentId,
    },
  });
  return !!child;
};


const createMedicationForSelf = async (medicationData, userId) => {
  const { name, dosage, stockQuantity, reminderTimes, daysOfWeek, medicationType, medicationForm } = medicationData;

  if (!name || !dosage || !stockQuantity || !reminderTimes || !reminderTimes.length || !daysOfWeek || !daysOfWeek.length || !medicationType || !medicationForm) {
    throw new Error('Missing required fields');
  }

  const frequency = reminderTimes.length * (daysOfWeek.includes('everyday') ? 7 : daysOfWeek.length); // Total reminders per week
  const now = new Date();


  const medication = await Medication.create({
    name,
    dosage,
    frequency,
    stockQuantity,
    userId,
    medicationForm,
    medicationType,
  });

 
  let medicationRulePayloads = [];

  
  if (daysOfWeek.includes('everyday')) {
    medicationRulePayloads = reminderTimes.map((time) => ({
      medicationId: medication.medicationId,
      ruleTime: time,
      userId,
      dayTime: 'everyday',
    }));
  } else {
    
    daysOfWeek.forEach((day) => {
      reminderTimes.forEach((time) => {
        medicationRulePayloads.push({
          medicationId: medication.medicationId,
          ruleTime: time,
          dayTime: day,
          userId,
        });
      });
    });
  }

  const medicationRules = await MedicationRule.bulkCreate(medicationRulePayloads, {
    returning: true,
  });

  const totalIntakes = Math.floor(stockQuantity / dosage);
  const medicationTimes = [];

  // 4. Create MedicationTimes for each day until stock is exhausted
  if (daysOfWeek.includes('everyday')) {
    for (let dayOffset = 0; dayOffset < totalIntakes / reminderTimes.length; dayOffset++) {
      for (const rule of medicationRules) {
        const timeParts = rule.ruleTime.split(':');
        const reminderDateTime = new Date(now);
        reminderDateTime.setDate(now.getDate() + dayOffset);
        reminderDateTime.setHours(timeParts[0], timeParts[1], timeParts[2] || 0, 0);

        medicationTimes.push({
          medicationRuleId: rule.medicationRuleId,
          medicationId: medication.medicationId,
          userId,
          reminderTime: reminderDateTime,
        });
      }
    }
  } else {
    // For weekly schedules, use the original logic
    const totalWeeks = Math.ceil(totalIntakes / frequency);

    for (let weekOffset = 0; weekOffset < totalWeeks; weekOffset++) {
      for (const rule of medicationRules) {
        if (medicationTimes.length >= totalIntakes) break;

        const timeParts = rule.ruleTime.split(':');
        const reminderDateTime = new Date(now);

        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(rule.dayTime);
        const currentDay = now.getDay();

        let daysToAdd = dayIndex - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        daysToAdd += weekOffset * 7;

        reminderDateTime.setDate(now.getDate() + daysToAdd);
        reminderDateTime.setHours(timeParts[0], timeParts[1], timeParts[2] || 0, 0);

        medicationTimes.push({
          medicationRuleId: rule.medicationRuleId,
          medicationId: medication.medicationId,
          userId,
          reminderTime: reminderDateTime,
        });
      }
    }
  }

  await MedicationTime.bulkCreate(medicationTimes);

  
  try {
    await scheduleMedicationNotifications(medication.medicationId, userId);
    console.log(`[Medication Service] Scheduled notifications for medication ${medication.medicationId}`);
  } catch (error) {
    console.error('[Medication Service] Error scheduling notifications:', error);

  }

  return {
    medication,
    medicationRules,
    medicationTimes,
  };
};


const updateReminderTimeForSelf = async (medicationData, userId) => {
  const { medicationRuleId, newTime } = medicationData;

  console.log("Updating medicationRuleId:", medicationRuleId, "with newTime:", newTime);

  if (!medicationRuleId || !newTime) {
    throw new Error('Missing required fields');
  }

 
  const rule = await MedicationRule.findOne({
    where: {
      medicationRuleId,
      userId,
    },
  });

  console.log("Found rule:", rule);

  if (!rule) {
    throw new Error('Medication rule not found or does not belong to user');
  }


  rule.ruleTime = newTime;
  await rule.save();


  const timeParts = newTime.split(':'); // e.g., ["20", "30", "00"]
  const [hours, minutes, seconds] = timeParts.map((part) => parseInt(part, 10));

  const medicationTimes = await MedicationTime.findAll({
    where: {
      medicationRuleId,
      userId,
    },
  });

  const updatedTimes = medicationTimes.map((mt) => {
    const originalDate = new Date(mt.reminderTime);
    if (isNaN(originalDate.getTime())) {
      throw new Error(`Invalid reminderTime in database for ID: ${mt.id}`);
    }

    const newDate = new Date(originalDate); // Clone the date
    newDate.setHours(hours, minutes, seconds || 0);

    mt.reminderTime = newDate;
    return mt.save();
  });

  await Promise.all(updatedTimes);

  return {
    updatedRule: rule,
    updatedTimes: await MedicationTime.findAll({
      where: { medicationRuleId, userId },
    }),
  };
};


const updateReminderTimeForChild = async (medicationData, userId) => {
  const { medicationRuleId, newTime } = medicationData;

  console.log("Updating medicationRuleId:", medicationRuleId, "with newTime:", newTime);

  if (!medicationRuleId || !newTime) {
    throw new Error('Missing required fields');
  }

  // 1. Find the rule and check ownership
  const rule = await MedicationRule.findOne({
    where: {
      medicationRuleId,
      userId,
    },
  });

  console.log("Found rule:", rule);

  if (!rule) {
    throw new Error('Medication rule not found or does not belong to user');
  }

  // 2. Update the rule's time
  rule.ruleTime = newTime;
  await rule.save();

  // 3. Update all associated MedicationTime records
  const timeParts = newTime.split(':'); // e.g., ["20", "30", "00"]
  const [hours, minutes, seconds] = timeParts.map((part) => parseInt(part, 10));

  const medicationTimes = await MedicationTime.findAll({
    where: {
      medicationRuleId,
      userId,
    },
  });

  const updatedTimes = medicationTimes.map((mt) => {
    const originalDate = new Date(mt.reminderTime);
    if (isNaN(originalDate.getTime())) {
      throw new Error(`Invalid reminderTime in database for ID: ${mt.id}`);
    }

    const newDate = new Date(originalDate); // Clone the date
    newDate.setHours(hours, minutes, seconds || 0);

    mt.reminderTime = newDate;
    return mt.save();
  });

  await Promise.all(updatedTimes);

  return {
    updatedRule: rule,
    updatedTimes: await MedicationTime.findAll({
      where: { medicationRuleId, userId },
    }),
  };
};

// Update medication for themself (without times)
const updateMedicationForSelf = async (medicationData, userId) => {
  const { medicationId, name, dosage, stockQuantity, reminderTimes, daysOfWeek, medicationForm, medicationType } = medicationData;

  if (!name || !dosage || stockQuantity === undefined || stockQuantity === null || !reminderTimes || !reminderTimes.length || !daysOfWeek || !daysOfWeek.length) {
    throw new Error('Missing required fields');
  }

  const frequency = reminderTimes.length * (daysOfWeek.includes('everyday') ? 7 : daysOfWeek.length);
  const now = new Date();

  // 1. Find the existing Medication
  const medication = await Medication.findOne({ where: { medicationId, userId } });

  if (!medication) {
    throw new Error('Medication not found');
  }

  // 2. Update Medication
  await medication.update({
    name,
    dosage,
    frequency,
    stockQuantity,
    medicationForm,
    medicationType
  });

  // 3. Delete all MedicationTimes where status is 'not-taken'
  await MedicationTime.destroy({
    where: {
      medicationId,
      userId,
      medicationStatus: 'not-taken',
    },
  });

  // 4. Delete all MedicationRules (we'll recreate them)
  await MedicationRule.destroy({
    where: {
      medicationId,
      userId,
    },
  });

  // 5. Create new MedicationRules (same logic as create)
  let medicationRulePayloads = [];

  if (daysOfWeek.includes('everyday')) {
    medicationRulePayloads = reminderTimes.map((time) => ({
      medicationId: medication.medicationId,
      ruleTime: time,
      userId,
      dayTime: 'everyday',
    }));
  } else {
    daysOfWeek.forEach((day) => {
      reminderTimes.forEach((time) => {
        medicationRulePayloads.push({
          medicationId: medication.medicationId,
          ruleTime: time,
          dayTime: day,
          userId,
        });
      });
    });
  }

  const medicationRules = await MedicationRule.bulkCreate(medicationRulePayloads, {
    returning: true,
  });

  // 6. Calculate total number of doses needed
  const totalIntakes = Math.floor(stockQuantity / dosage);
  const medicationTimes = [];

  // 7. Create MedicationTimes (same logic as create)
  if (daysOfWeek.includes('everyday')) {
    // For everyday medications, create one entry per day
    for (let dayOffset = 0; dayOffset < totalIntakes / reminderTimes.length; dayOffset++) {
      for (const rule of medicationRules) {
        const timeParts = rule.ruleTime.split(':');
        const reminderDateTime = new Date(now);
        reminderDateTime.setDate(now.getDate() + dayOffset);
        reminderDateTime.setHours(timeParts[0], timeParts[1], timeParts[2] || 0, 0);

        medicationTimes.push({
          medicationRuleId: rule.medicationRuleId,
          medicationId: medication.medicationId,
          userId,
          reminderTime: reminderDateTime,
        });
      }
    }
  } else {
    // For weekly schedules
    const totalWeeks = Math.ceil(totalIntakes / frequency);

    for (let weekOffset = 0; weekOffset < totalWeeks; weekOffset++) {
      for (const rule of medicationRules) {
        if (medicationTimes.length >= totalIntakes) break;

        const timeParts = rule.ruleTime.split(':');
        const reminderDateTime = new Date(now);

        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(rule.dayTime);
        const currentDay = now.getDay();

        let daysToAdd = dayIndex - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        daysToAdd += weekOffset * 7;

        reminderDateTime.setDate(now.getDate() + daysToAdd);
        reminderDateTime.setHours(timeParts[0], timeParts[1], timeParts[2] || 0, 0);

        medicationTimes.push({
          medicationRuleId: rule.medicationRuleId,
          medicationId: medication.medicationId,
          userId,
          reminderTime: reminderDateTime,
          medicationStatus: 'not-taken',
        });
      }
    }
  }

  // 8. Create new MedicationTimes
  await MedicationTime.bulkCreate(medicationTimes);

  // 9. Cancel old notification jobs before rescheduling
  try {
    await cancelMedicationJobs(medication.medicationId, userId);
    console.log(`[Medication Service] Cancelled old jobs for medication ${medication.medicationId}`);
  } catch (error) {
    console.error('[Medication Service] Error cancelling old jobs:', error);
    // Continue with rescheduling even if cancellation fails
  }

  // 10. Reschedule push notifications for this medication
  try {
    await scheduleMedicationNotifications(medication.medicationId, userId);
    console.log(`[Medication Service] Rescheduled notifications for medication ${medication.medicationId}`);
  } catch (error) {
    console.error('[Medication Service] Error rescheduling notifications:', error);
    // Don't fail the medication update if scheduling fails
  }

  return {
    message: 'Medication updated successfully',
  };
};

// Update medication for a child (dependent) (without times)
const updateMedicationForChild = async (medicationData, userId) => {
  const { medicationId, name, dosage, stockQuantity, reminderTimes, daysOfWeek, medicationForm, medicationType } = medicationData;

  if (!name || !dosage || stockQuantity === undefined || stockQuantity === null || !reminderTimes || !reminderTimes.length || !daysOfWeek || !daysOfWeek.length) {
    throw new Error('Missing required fields');
  }

  const frequency = reminderTimes.length * (daysOfWeek.includes('everyday') ? 7 : daysOfWeek.length);
  const now = new Date();

  // 1. Find the existing Medication
  const medication = await Medication.findOne({ where: { medicationId, userId } });

  if (!medication) {
    throw new Error('Medication not found');
  }

  // 2. Update Medication
  await medication.update({
    name,
    dosage,
    frequency,
    stockQuantity,
    medicationForm,
    medicationType
  });

  // 3. Delete all MedicationTimes where status is 'not-taken'
  await MedicationTime.destroy({
    where: {
      medicationId,
      userId,
      medicationStatus: 'not-taken',
    },
  });

  // 4. Delete all MedicationRules (we'll recreate them)
  await MedicationRule.destroy({
    where: {
      medicationId,
      userId,
    },
  });

  // 5. Create new MedicationRules (same logic as updateMedicationForSelf)
  let medicationRulePayloads = [];

  if (daysOfWeek.includes('everyday')) {
    medicationRulePayloads = reminderTimes.map((time) => ({
      medicationId: medication.medicationId,
      ruleTime: time,
      userId,
      dayTime: 'everyday',
    }));
  } else {
    daysOfWeek.forEach((day) => {
      reminderTimes.forEach((time) => {
        medicationRulePayloads.push({
          medicationId: medication.medicationId,
          ruleTime: time,
          dayTime: day,
          userId,
        });
      });
    });
  }

  const medicationRules = await MedicationRule.bulkCreate(medicationRulePayloads, {
    returning: true,
  });

  // 6. Calculate total number of doses needed
  const totalIntakes = Math.floor(stockQuantity / dosage);
  const medicationTimes = [];

  // 7. Create MedicationTimes (same logic as updateMedicationForSelf)
  if (daysOfWeek.includes('everyday')) {
    // For everyday medications, create one entry per day
    for (let dayOffset = 0; dayOffset < totalIntakes / reminderTimes.length; dayOffset++) {
      for (const rule of medicationRules) {
        const timeParts = rule.ruleTime.split(':');
        const reminderDateTime = new Date(now);
        reminderDateTime.setDate(now.getDate() + dayOffset);
        reminderDateTime.setHours(timeParts[0], timeParts[1], timeParts[2] || 0, 0);

        medicationTimes.push({
          medicationRuleId: rule.medicationRuleId,
          medicationId: medication.medicationId,
          userId,
          reminderTime: reminderDateTime,
        });
      }
    }
  } else {
    // For weekly schedules
    const totalWeeks = Math.ceil(totalIntakes / frequency);

    for (let weekOffset = 0; weekOffset < totalWeeks; weekOffset++) {
      for (const rule of medicationRules) {
        if (medicationTimes.length >= totalIntakes) break;

        const timeParts = rule.ruleTime.split(':');
        const reminderDateTime = new Date(now);

        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(rule.dayTime);
        const currentDay = now.getDay();

        let daysToAdd = dayIndex - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        daysToAdd += weekOffset * 7;

        reminderDateTime.setDate(now.getDate() + daysToAdd);
        reminderDateTime.setHours(timeParts[0], timeParts[1], timeParts[2] || 0, 0);

        medicationTimes.push({
          medicationRuleId: rule.medicationRuleId,
          medicationId: medication.medicationId,
          userId,
          reminderTime: reminderDateTime,
          medicationStatus: 'not-taken',
        });
      }
    }
  }

  // 8. Create new MedicationTimes
  await MedicationTime.bulkCreate(medicationTimes);

  // 9. Cancel old notification jobs before rescheduling
  try {
    await cancelMedicationJobs(medication.medicationId, userId);
    console.log(`[Medication Service] Cancelled old jobs for medication ${medication.medicationId}`);
  } catch (error) {
    console.error('[Medication Service] Error cancelling old jobs:', error);
    // Continue with rescheduling even if cancellation fails
  }

  // 10. Reschedule push notifications for this medication
  try {
    await scheduleMedicationNotifications(medication.medicationId, userId);
    console.log(`[Medication Service] Rescheduled notifications for medication ${medication.medicationId}`);
  } catch (error) {
    console.error('[Medication Service] Error rescheduling notifications:', error);
    // Don't fail the medication update if scheduling fails
  }

  return {
    message: 'Medication updated successfully',
  };
};

// Delete medication for themself
const deleteMedicationForSelf = async (medicationId, userId) => {
  try {
    const medication = await Medication.findOne({
      where: { medicationId, userId },
    });
    if (!medication) {
      return null;
    }

    // Cancel all scheduled notifications (main + follow-ups) for this medication
    try {
      // Get all medication times for this medication
      const medicationTimes = await MedicationTime.findAll({
        where: { medicationId, userId }
      });

      // Cancel ALL jobs (main + follow-ups) for each medication time
      for (const medTime of medicationTimes) {
        await cancelAllJobs(medTime.medicationTimeId);
        console.log(`[Medication Service] Cancelled all jobs for medication time ${medTime.medicationTimeId}`);
      }
    } catch (error) {
      console.error('[Medication Service] Error cancelling jobs:', error);
      // Continue with deletion even if cancel fails
    }

    await medication.destroy();
    return medication;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Delete medication for a child (dependent)
const deleteMedicationForChild = async (medicationId, userId) => {
  try {
    const medication = await Medication.findOne({
      where: { medicationId, userId },
    });
    if (!medication) {
      return null;
    }

    // Cancel all scheduled notifications (main + follow-ups) for this medication
    try {
      // Get all medication times for this medication
      const medicationTimes = await MedicationTime.findAll({
        where: { medicationId, userId }
      });

      // Cancel ALL jobs (main + follow-ups) for each medication time
      for (const medTime of medicationTimes) {
        await cancelAllJobs(medTime.medicationTimeId);
        console.log(`[Medication Service] Cancelled all jobs for medication time ${medTime.medicationTimeId}`);
      }
    } catch (error) {
      console.error('[Medication Service] Error cancelling jobs:', error);
      // Continue with deletion even if cancel fails
    }

    await medication.destroy();
    return medication;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Get medication ID by medicationTimeId
const getMedicationIdByMedicationTimeId = async (medicationTimeId, userId) => {
  const medicationTime = await MedicationTime.findOne({
    where: { medicationTimeId: medicationTimeId, userId },
  });

  if (!medicationTime) {
    return null; // Not found or unauthorized
  }

  return medicationTime.medicationId;
};

// Set medication as taken
const setMedicationAsTaken = async (medicationId, medicationTimeId, userId) => {
  const currentTime = new Date();

  // 1. Find the MedicationTime entry
  const medicationTime = await MedicationTime.findOne({
    where: { medicationTimeId, userId },
  });

  if (!medicationTime) {
    throw new Error('MedicationTime not found');
  }

  // 2. Prevent re-taking if already marked taken or late
  if (medicationTime.medicationStatus === 'taken' || medicationTime.medicationStatus === 'late') {
    throw new Error('This medication has already been taken or marked as late.');
  }

  // 3. Find the Medication to get dosage and update stock
  const medication = await Medication.findOne({
    where: { medicationId, userId },
  });

  if (!medication) {
    throw new Error('Medication not found');
  }

  // 4. Calculate whether taken late or on time
  const scheduledTime = new Date(medicationTime.reminderTime);
  const diffInMinutes = (currentTime - scheduledTime) / 1000 / 60; // convert ms to minutes

  let status;
  if (diffInMinutes >= 0 && diffInMinutes <= 30) {
    status = "taken";
  } else if (diffInMinutes > 30) {
    status = "late";
  } else {
    status = "taken";
  }

  // 5. Update stock (subtract dosage)
  const newStock = medication.stockQuantity - medication.dosage;
  await medication.update({ stockQuantity: newStock });

  // 6. Update MedicationTime with isTaken and status
  await medicationTime.update({
    medicationStatus: status,
  });

  // 7. Cancel follow-up notifications
  try {
    await cancelFollowUps(medicationTimeId);
    console.log(`[Medication Service] Cancelled follow-ups for medication time ${medicationTimeId}`);

    // [ADD-ON] Also cancel guardian alert if dependent took the medication
    cancelGuardianAlert(medicationTimeId);
  } catch (error) {
    console.error('[Medication Service] Error cancelling follow-ups:', error);
    // Don't fail the operation if cancellation fails
  }


  // 8. Create a MedicationLog
  const medicationLog = await MedicationLog.create({
    userId: userId,
    medicationId,
    medicationTimeId,
    takenAt: currentTime,
    status: status,
  });

  console.log("Medication log created:", medicationLog);

  return {
    medicationLog,
    followUpNotificationId: medicationTime.followUpNotificationIds
  };
};

// Get all medication for self
const getAllMedicationsForSelf = async (userId) => {
  return await Medication.findAll({ where: { userId } });
};

// Get all medications for a child (dependent)
const getAllMedicationsForChild = async (userId) => {
  return await Medication.findAll({ where: { userId } });
};

// Get a medication info by medicationId for self
const getMedicationInfoForSelf = async (medicationId, userId) => {
  return await Medication.findOne({
    where: { medicationId, userId },
  });
};

// Get a medication info by medicationId for a child (dependent)
const getMedicationInfoForChild = async (medicationId, userId) => {
  return await Medication.findOne({
    where: { medicationId, userId },
  });
};

// Get all medications times for self
const getAllMedicationTimesForSelf = async (userId) => {

  console.log("userId:", userId);
  const schedule = await MedicationTime.findAll({
    where: { userId },
    include: [
      {
        model: Medication,
        attributes: ['name'], // Include only the 'name' and 'userId' from Medication
      },
    ],
  });

  // Format the result with the desired fields
  return schedule.map(entry => ({
    medicationId: entry.medicationId,
    medicationTimeId: entry.medicationTimeId,
    medicationRuleId: entry.medicationRuleId,
    reminderTime: entry.reminderTime,
    medicationStatus: entry.medicationStatus,
    userId: entry.userId,
    name: entry.Medication.name, // Access the associated Medication's name
  }));
};

// Get all medications times for a child (dependent)
const getAllMedicationTimesForChild = async (userId) => {
  return await MedicationTime.findAll({ where: { userId } });
};

// Get a medication time by medicationTimeId for self
const getMedicationTimeInfoForSelf = async (medicationId, userId) => {
  return await MedicationTime.findOne({
    where: { medicationId, userId },
  });
};

// Get a medication time by medicationTimeId for a child (dependent)
const getMedicationTimeInfoForChild = async (medicationId, userId) => {
  return await MedicationTime.findOne({
    where: { medicationId, userId },
  });
};


const getMedicationWithRemindersForSelf = async (medicationId, userId) => {
  const medication = await Medication.findOne({
    where: { medicationId, userId },
  });

  if (!medication) return null;

  const rules = await MedicationRule.findAll({
    where: { medicationId, userId },
    attributes: ['ruleTime', 'dayTime'],
  });

  // Get unique dayTimes
  const dayTimes = [...new Set(rules.map(rule => rule.dayTime))];

  // Get unique reminderTimes using Set
  const reminderTimes = [...new Set(rules.map(rule => rule.ruleTime))];

  return {
    name: medication.name,
    dosage: medication.dosage,
    stockQuantity: medication.stockQuantity,
    dayTimes,
    medicationType: medication.medicationType,
    medicationForm: medication.medicationForm,
    reminderTimes, // Now this will contain only unique times
  };
};

const getAllDateThatHasScheduledMedications = async (userId) => {
  const medicationTimes = await MedicationTime.findAll({
    where: { userId },
    attributes: ['reminderTime'],
  });

  // Extract dates from the medicationTimes
  const dates = medicationTimes.map(mt => {
    const date = new Date(mt.reminderTime);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });

  // Remove duplicates
  const uniqueDates = [...new Set(dates)];

  // Format the response with "date": before each date
  const formattedDates = uniqueDates.map(date => ({
    date: date
  }));

  return formattedDates;
}

const getMedicationReminderForCertainDate = async (userId, date) => {
  const medicationTimes = await MedicationTime.findAll({
    where: {
      userId,
      reminderTime: {
        [db.Sequelize.Op.gte]: `${date} 00:00:00`, // Start of the day
        [db.Sequelize.Op.lt]: `${date} 23:59:59`, // End of the day
      },
    },
    include: [
      {
        model: Medication,
        attributes: ['name', 'dosage'],
        // Include only the 'name' from Medication
      },
    ],
  });

  // Format the result with the desired fields
  return medicationTimes.map(entry => ({
    medicationId: entry.medicationId,
    medicationTimeId: entry.medicationTimeId,
    medicationRuleId: entry.medicationRuleId,
    reminderTime: entry.reminderTime,
    dosage: entry.Medication.dosage,
    medicationStatus: entry.medicationStatus,
    userId: entry.userId,
    name: entry.Medication.name, // Access the associated Medication's name
  }));
};

const getMedicationHistoryForSelf = async (userId, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const medicationLogs = await MedicationLog.findAll({
    where: {
      userId,
      takenAt: {
        [db.Sequelize.Op.gte]: start,
        [db.Sequelize.Op.lte]: end,
      },
    },
    include: [
      {
        model: Medication,
        attributes: ['name'], // only name
      },
    ],
  });

  return medicationLogs.map(log => {
    const takenAt = new Date(log.takenAt);
    const date = takenAt.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = takenAt.toTimeString().slice(0, 5);  // HH:mm

    return {
      id: log.medicationLogId,
      date,
      time,
      status: log.status,
      name: log.Medication.name, // name only
    };
  });
};

const updateNotificationIds = async (userId, medicationTimeId, mainNotificationId, followUpNotificationIds) => {

  console.log("Updating notification IDs for userId:", userId, "medicationTimeId:", medicationTimeId, "mainNotificationId:", mainNotificationId, "followUpNotificationId:", followUpNotificationIds);
  const medicationTime = await MedicationTime.findOne({
    where: { medicationTimeId, userId },
  });

  console.log("Found medicationTime:", medicationTime);

  if (!medicationTime) {
    throw new Error('Medication time not found');
  }

  await medicationTime.update({
    mainNotificationId,
    followUpNotificationIds,
  });
  return medicationTime;
}

const getNotificationSettings = async (userId) => {
  const user = await User.findOne({
    where: { userId },
    attributes: ['followUpIntervalMinutes', 'followUpCount'],
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    followUpIntervalMinutes: user.followUpIntervalMinutes,
    followUpCount: user.followUpCount,
  };
}

const updateNotificationSettings = async (userId, followUpIntervalMinutes, followUpCount) => {
  const user = await User.findOne({
    where: { userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await user.update({
    followUpIntervalMinutes,
    followUpCount,
  });

  // Reschedule all notifications for this user with new settings
  try {
    await rescheduleUserNotifications(userId);
    console.log(`[Medication Service] Rescheduled all notifications for user ${userId} with new settings`);
  } catch (error) {
    console.error('[Medication Service] Error rescheduling notifications:', error);
    // Don't fail the settings update if rescheduling fails
  }

  return {
    followUpIntervalMinutes: user.followUpIntervalMinutes,
    followUpCount: user.followUpCount,
  };
}

module.exports = {
  isChildOf,
  createMedicationForSelf,
  updateReminderTimeForSelf,
  updateReminderTimeForChild,
  setMedicationAsTaken,
  getMedicationIdByMedicationTimeId,
  updateMedicationForSelf,
  updateMedicationForChild,
  deleteMedicationForSelf,
  deleteMedicationForChild,
  getAllMedicationsForSelf,
  getAllMedicationsForChild,
  getMedicationInfoForSelf,
  getMedicationInfoForChild,
  getAllMedicationTimesForSelf,
  getAllMedicationTimesForChild,
  getMedicationTimeInfoForSelf,
  getMedicationTimeInfoForChild,
  getMedicationWithRemindersForSelf,
  getAllDateThatHasScheduledMedications,
  getMedicationReminderForCertainDate,
  getMedicationHistoryForSelf,
  updateNotificationIds,
  getNotificationSettings,
  updateNotificationSettings,
};
