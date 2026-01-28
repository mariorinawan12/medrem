const express = require("express");
const medicationController = require("../controllers/medicationController");
const authenticate = require("../middlewares/authMiddleware");

const router = express.Router();

// Create medication (for self or parent)
router.post("/create", authenticate, medicationController.createMedicationForSelf);
// Create medication for a child (dependent)
router.post("/create-dependent", authenticate, medicationController.createMedicationForChild);

// Update reminder time (for self)
router.post("/update-reminder-time", authenticate, medicationController.updateReminderTimeForSelf);

// Update reminder time (for child)
router.post("/update-reminder-time-dependent", authenticate, medicationController.updateReminderTimeForChild);

// Set medication as taken
router.post("/set-taken", authenticate, medicationController.setMedicationAsTaken);

// Update medication (for self)
router.post("/update", authenticate, medicationController.updateMedicationForSelf);

// Update medication (for child)
router.post("/update-dependent", authenticate, medicationController.updateMedicationForChild);

// Delete medication (for self)
router.post("/delete", authenticate, medicationController.deleteMedicationForSelf);

// Delete medication (for child)
router.post("/delete-dependent", authenticate, medicationController.deleteMedicationForChild);

// Get all medications for self
router.post("/list", authenticate, medicationController.getAllMedicationsForSelf);

// Get all medications for a child (dependent)
router.post("/list-dependent", authenticate, medicationController.getAllMedicationsForChild);

// Get medication info for self
router.post("/info", authenticate, medicationController.getMedicationInfoForSelf);

// Get medication info for a child (dependent)
router.post("/info-dependent", authenticate, medicationController.getMedicationInfoForChild);

// Get all medication times for self
router.post("/schedule", authenticate, medicationController.getAllMedicationTimesForSelf);

// Get all medication times for a child (dependent)
router.post("/schedule-dependent", authenticate, medicationController.getAllMedicationTimesForChild);

// Get medication time info for self
router.post("/one-schedule", authenticate, medicationController.getMedicationTimeInfoForSelf);

// Get medication time info for a child (dependent)
router.post("/one-schedule-dependent", authenticate, medicationController.getMedicationTimeInfoForChild);

router.post("/get-medication-with-reminder", authenticate, medicationController.getMedicationWithRemindersForSelf);

router.post("/get-medication-with-reminder-dependent", authenticate, medicationController.getMedicationWithRemindersForChild);


router.post("/get-all-dates", authenticate, medicationController.getAllDateThatHasScheduledMedicationsForSelf);

router.post("/get-schedule-for-date", authenticate, medicationController.getMedicationReminderForCertainDate);

router.post("/get-all-dates-dependent", authenticate, medicationController.getAllDateThatHasScheduledMedicationsForChild);

router.post("/get-schedule-for-date-dependent", authenticate, medicationController.getMedicationReminderForCertainDateForChild);

router.post("/get-medication-history", authenticate, medicationController.getMedicationHistoryForSelf);

router.post("/get-medication-history-dependent", authenticate, medicationController.getMedicationHistoryForDependent);

router.post("/update-notification-id", authenticate, medicationController.updateMedicationNotification);

router.post("/notification-settings", authenticate, medicationController.getNotificationSettings)

router.post("/update-notification-settings", authenticate, medicationController.updateNotificationSettings)
module.exports = router;
