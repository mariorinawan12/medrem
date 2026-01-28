const express = require("express");
const dependentController = require("../controllers/dependentController");
const authenticate = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", authenticate, dependentController.createDependent);// Done
router.post("/delete", authenticate, dependentController.deleteDependent);
router.post("/", authenticate, dependentController.getDependents);
router.post("/generate-login-code", authenticate, dependentController.generateLoginCode);
router.post("/login-with-code", dependentController.loginDependentWithCode);
router.post("/dependent-details", authenticate, dependentController.fetchDependentDetails);
router.post("/update-dependent-details", authenticate, dependentController.updateDependentDetails);

module.exports = router;
