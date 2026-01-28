const user = require("../models/user");
const { use, get } = require("../routes/dependent");
const medicationService = require("../services/medicationService");


const createMedicationForChild = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId, ...medicationData } = req.body;
    console.log("Parent making request:", parentId);
    console.log("Target userId:", userId);
    

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Check if requester is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can add medications for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to create medication for this user." });
    }

    const medication = await medicationService.createMedicationForSelf(medicationData, userId);
    res.status(201).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createMedicationForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("userid:",userId);
    const medicationData = req.body;

    const medication = await medicationService.createMedicationForSelf(medicationData, userId);

    res.status(201).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateReminderTimeForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { medicationRuleId, newTime } = req.body;

    console.log("Updating medicationRuleId:", medicationRuleId, "with newTime:", newTime);

    const result = await medicationService.updateReminderTimeForSelf(
      { medicationRuleId, newTime },
      userId
    );

    if (!result) {
      return res.status(404).json({ message: "Medication rule not found." });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateReminderTimeForChild = async (req, res) => {
  try {
  const parentId = req.user.userId;
    const { userId, medicationRuleId, newTime } = req.body;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Check if requester is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can update medications for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to update medication for this user." });
    }

    const result = await medicationService.updateReminderTimeForChild(
      { medicationRuleId, newTime },
      userId
    );

    if (!result) {
      return res.status(404).json({ message: "Medication rule not found." });
    }

    res.status(200).json(result);
  }
    catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const setMedicationAsTaken = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { medicationTimeId } = req.body;
    
    console.log("userid:",userId);
    console.log("medicationTimeId:",medicationTimeId);

    if (!medicationTimeId) {
      return res.status(400).json({ message: "Medication time ID is required." });
    }

    // find medication id by medicationTimeId
    const medicationId = await medicationService.getMedicationIdByMedicationTimeId(medicationTimeId, userId);
    console.log("medicationId:",medicationId);
    if (!medicationId) {
      return res.status(404).json({ message: "Medication time not found." });
    }

    const result = await medicationService.setMedicationAsTaken(medicationId, medicationTimeId, userId);

    if (!result) {
      return res.status(404).json({ message: "Medication time not found or already taken." });
    }

    res.status(200).json({ 
      message: "Medication marked as taken.",
      followUpNotificationId: result.followUpNotificationId,  // include it here
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const updateMedicationForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const medicationData = req.body;

    console.log("medicationData:",medicationData);


    const medication = await medicationService.updateMedicationForSelf(medicationData, userId);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMedicationForChild = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId, ...medicationData } = req.body;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Check if requester is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can update medications for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to update medication for this user." });
    }

    const medication = await medicationService.updateMedicationForSelf(medicationData, userId);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const deleteMedicationForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const body = req.body

    console.log("userid:",userId);
    console.log("medicationId:",body.medicationId);

    const result = await medicationService.deleteMedicationForSelf(body.medicationId, userId);

    if (!result) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json({ message: "Medication deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMedicationForChild = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId, medicationId } = req.body;

    console.log("userId: ", userId);
    console.log("medicationId: ", medicationId);

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Check if requester is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can delete medications for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to delete medication for this user." });
    }

    const result = await medicationService.deleteMedicationForChild(medicationId, userId);

    if (!result) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json({ message: "Medication deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getAllMedicationsForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const medications = await medicationService.getAllMedicationsForSelf(userId);

    if (!medications || medications.length === 0) {
      return res.status(404).json({ message: "No medications found." });
    }

    res.status(200).json(medications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllMedicationsForChild = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId } = req.body;
    
    // Check if the user is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can view medications for others." });
    }
    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to view medication for this user." });
    }
    // Fetch medications for the child
    const medications = await medicationService.getAllMedicationsForChild(userId);
    if (!medications || medications.length === 0) {
      return res.status(404).json({ message: "No medications found." });
    }
    res.status(200).json(medications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMedicationInfoForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { medicationId } = req.body;

    if (!medicationId) {
      return res.status(400).json({ message: "Medication ID is required." });
    }

    const medication = await medicationService.getMedicationInfoForSelf(medicationId, userId);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getMedicationInfoForChild = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId, medicationId } = req.body;

    // Check if the user is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can view medications for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to view medication for this user." });
    }

    const medication = await medicationService.getMedicationInfoForChild(medicationId, userId);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getAllMedicationTimesForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const medicationTimes = await medicationService.getAllMedicationTimesForSelf(userId);

    if (!medicationTimes || medicationTimes.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(medicationTimes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllMedicationTimesForChild = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId } = req.body;

    // Check if the user is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can view medication times for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to view medication times for this user." });
    }

    const medicationTimes = await medicationService.getAllMedicationTimesForChild(userId);

    if (!medicationTimes || medicationTimes.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(medicationTimes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getMedicationTimeInfoForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { medicationId } = req.body;

    if (!medicationId) {
      return res.status(400).json({ message: "Medication Id is required." });
    }

    const medicationTime = await medicationService.getMedicationTimeInfoForSelf(medicationId, userId);

    if (!medicationTime) {
      return res.status(404).json({ message: "Medication time not found." });
    }

    res.status(200).json(medicationTime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getMedicationTimeInfoForChild = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId, medicationId } = req.body;

    // Check if the user is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can view medication times for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to view medication times for this user." });
    }

    const medicationTime = await medicationService.getMedicationTimeInfoForChild(medicationId, userId);

    if (!medicationTime) {
      return res.status(404).json({ message: "Medication time not found." });
    }

    res.status(200).json(medicationTime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// put the medicationId in the service
const getMedicationWithRemindersForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { medicationId } = req.body;

    if (!medicationId) {
      return res.status(400).json({ message: "Medication ID is required." });
    }

    const medication = await medicationService.getMedicationWithRemindersForSelf(medicationId, userId);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getMedicationWithRemindersForChild = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId, medicationId } = req.body;

    // Check if the user is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can view medications for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to view medication for this user." });
    }

    const medication = await medicationService.getMedicationWithRemindersForSelf(medicationId, userId);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getAllDateThatHasScheduledMedicationsForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;


    const medication = await medicationService.getAllDateThatHasScheduledMedications(userId);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getAllDateThatHasScheduledMedicationsForChild = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId } = req.body;

    // Check if the user is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can view medications for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to view medication for this user." });
    }

    const medication = await medicationService.getAllDateThatHasScheduledMedications(userId);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getMedicationReminderForCertainDate = async (req, res) => {
  try{
    const userId = req.user.userId;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const medication = await medicationService.getMedicationReminderForCertainDate(userId, date);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getMedicationReminderForCertainDateForChild = async (req, res) => {
  try{
    const parentId = req.user.userId;
    const { userId, date } = req.body;

    // Check if the user is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can view medications for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to view medication for this user." });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const medication = await medicationService.getMedicationReminderForCertainDate(userId, date);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found." });
    }

    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getMedicationHistoryForSelf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.body;

    const history = await medicationService.getMedicationHistoryForSelf(userId, startDate, endDate);

    if (!history || history.length === 0) {
      return res.status(404).json({ message: "No medication history found." });
    }

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getMedicationHistoryForDependent = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { userId, startDate, endDate } = req.body;

    // Check if the user is a parent
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only parent users can view medication history for others." });
    }

    // Check if the specified userId belongs to a dependent of this parent
    const isChild = await medicationService.isChildOf(parentId, userId);
    if (!isChild) {
      return res.status(403).json({ message: "You are not allowed to view medication history for this user." });
    }

    const history = await medicationService.getMedicationHistoryForSelf(userId, startDate, endDate);

    if (!history || history.length === 0) {
      return res.status(404).json({ message: "No medication history found." });
    }

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const updateMedicationNotification = async (req, res) => {
  try {
    console.log("updateMedicationNotification called");
    console.log("req.body:", req.body);
    const userId = req.user.userId;
    console.log("userId:", userId);
    const { medicationTimeId, mainNotificationId, followUpNotificationIds } = req.body;

    if (!medicationTimeId) {
      return res.status(400).json({ message: "Medication time ID is required." });
    }

    const result = await medicationService.updateNotificationIds(
      userId,
      medicationTimeId,
      mainNotificationId,
      followUpNotificationIds,
    );

    if (!result) {
      return res.status(404).json({ message: "Medication time not found." });
    }

    res.status(200).json({ message: "Medication notifications updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = await medicationService.getNotificationSettings(userId);

    if (!settings) {
      return res.status(404).json({ message: "Notification settings not found." });
    }

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { followUpIntervalMinutes} = req.body;

    const followUpIntervalMinute = followUpIntervalMinutes.followUpIntervalMinutes;
    const followUpCount = followUpIntervalMinutes.followUpCount;

    if( !followUpIntervalMinute || !followUpCount) {
      return res.status(400).json({ message: "Follow-up interval and count are required." });
    }
    
   
    const updatedSettings = await medicationService.updateNotificationSettings(userId, followUpIntervalMinute, followUpCount);

    if (!updatedSettings) {
      return res.status(404).json({ message: "Notification settings not found." });
    }

    res.status(200).json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


module.exports = {
  createMedicationForChild,
  createMedicationForSelf,
  updateReminderTimeForSelf,
  updateReminderTimeForChild,
  setMedicationAsTaken,
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
  getMedicationWithRemindersForChild,
  getAllDateThatHasScheduledMedicationsForSelf,
  getAllDateThatHasScheduledMedicationsForChild,
  getMedicationReminderForCertainDate,
  getMedicationReminderForCertainDateForChild,
  getMedicationHistoryForSelf,
  getMedicationHistoryForDependent,
  updateMedicationNotification,
  getNotificationSettings,
  updateNotificationSettings,
};
