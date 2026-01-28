const express = require("express");
const authController = require("../controllers/authController");
const authenticate = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-code", authController.verifyResetCode);
router.post("/reset-password", authController.resetPassword);
router.post("/fcm-token", authenticate, authController.updateFcmToken);
router.post("/fcm-token/unregister", authenticate, authController.unregisterFcmToken);
router.post("/user-details", authenticate, authController.fetchUserDetails);
router.post("/update-profile", authenticate, authController.updateUserDetails);
module.exports = router;
