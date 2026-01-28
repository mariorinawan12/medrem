;const bcrypt = require("bcryptjs");
const db = require("../models");
const User = db.User;
const dependentService = require("../services/dependentService");

const createDependent = async (req, res) => {
  try {
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only main users can create dependents" });
    }
    const { fullName, gender, dateOfBirth, age } = req.body;
    const dependent = await dependentService.createDependent(fullName, gender, dateOfBirth, age, req.user.userId);
    res.json({ message: "Dependent user created", dependent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDependents = async (req, res) => {
  try {
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only main users can view dependents" });
    }
    const dependents = await dependentService.getDependents(req.user.userId);
    res.json(dependents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const deleteDependent = async (req, res) => {
  try {
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only main users can delete dependents" });
    }

    const { userId } = req.body;
    const result = await dependentService.deleteDependent(req.user.userId, userId);

    if (!result) {
      return res.status(404).json({ message: "Dependent not found" });
    }

    res.json({ message: "Dependent deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateLoginCode = async (req, res) => {
  try {
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only main users can generate login codes" });
    }

    const { dependentId } = req.body;
    const codeData = await dependentService.generateLoginCode(dependentId, req.user.userId);

    res.json(codeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginDependentWithCode = async (req, res) => {
  try {
    const { code } = req.body; // Now only needs code
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const result = await dependentService.loginWithCode(code);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const fetchDependentDetails = async (req, res) => {
  try {
    if (req.user.role !== "main_user") {
      return res.status(403).json({ message: "Only main users can view dependent details" });
    }



    const { dependentId } = req.body;
    const details = await dependentService.fetchDependentDetails(req.user.userId, dependentId);

    if (!details) {
      return res.status(404).json({ message: "Dependent not found" });
    }

    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDependentDetails = async (req, res) => {
  try {
    const mainUserId = req.user.userId; // The parent user's ID
    const { dependentId, fullName, gender, dateOfBirth } = req.body;

    // First verify the dependent belongs to this user
    const dependent = await User.findOne({
      where: {
        userId: dependentId,
        parentId: mainUserId,
      },
    });

    if (!dependent) {
      return res.status(404).json({ message: 'Dependent not found or not authorized' });
    }

    // Prepare update data
    const updateData = {
      fullName,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
    };

    // Update using Sequelize's update method
    const [updatedCount] = await User.update(
      updateData,
      {
        where: { 
          userId: dependentId,
          parentId: mainUserId // Additional security check
        },
        returning: true // For PostgreSQL to return the updated record
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Dependent not found' });
    }

    // Fetch the updated dependent (alternative approach if returning doesn't work)
    const updatedDependent = await User.findByPk(dependentId, {
      attributes: { exclude: ['password'] } // Don't return password
    });

    res.json({
      success: true,
      message: 'Dependent updated successfully',
      dependent: updatedDependent
    });

  } catch (error) {
    console.error('Update dependent error:', error);
    res.status(500).json({ 
      message: 'Error updating dependent profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};









module.exports = { createDependent, getDependents, deleteDependent, generateLoginCode, loginDependentWithCode, fetchDependentDetails, updateDependentDetails };
