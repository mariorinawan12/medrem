const bcrypt = require("bcryptjs");
const db = require("../models");
const { Op } = require('sequelize');
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

const User = db.User;

const createDependent = async (name, gender, dateOfBirth, age, parentId) => {

    const dependent = await User.create({
      fullName: name,
      dateOfBirth: dateOfBirth,
      gender: gender,
      age: age,
      role: "dependent_user",
      parentId,
    });
  
    return dependent;
  };




const getDependents = async (userId) => {
    return await User.findAll({ where: { parentId: userId } });
};

const generateLoginCode = async (dependentId, parentId) => {
 

  console.log(Object.keys(User.rawAttributes));

  const dependent = await User.findOne({
    where: {
      userId: dependentId,
      parentId: parentId,
      role: 'dependent_user'
    }
  });

  if (!dependent) {
    console.error(`Dependent not found. dependentId=${dependentId}, parentId=${parentId}`);
    throw new Error('Dependent not found or not authorized');
  }

 
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  console.log(`Generated code ${code} for dependentId=${dependentId}`);

 
  try {
    console.log('Current DB values before update:', {
      loginCode: dependent.loginCode,
      codeExpiresAt: dependent.codeExpiresAt
    });
    
    dependent.loginCode = code;
    dependent.codeExpiresAt = expiresAt;
    await dependent.save();
    
    console.log(`Update successful: loginCode and codeExpiresAt set for userId=${dependent.userId}`);
  } catch (error) {
    console.error('Error updating loginCode:', error);
    throw error;
  }

 
  return { 
    code, 
    expiresAt,
    dependentEmail: dependent.email 
  };
};


const loginWithCode = async (code) => {
  const user = await User.findOne({
    where: {
      loginCode: code,
      codeExpiresAt: { [Op.gt]: new Date() },
      role: 'dependent_user'
    }
  });

  if (!user) {
    throw new Error('Invalid or expired code');
  }

  // Clear the code after successful login
  await user.update({
    loginCode: null,
    codeExpiresAt: null
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.userId, role: user.role },
    SECRET_KEY,
    { expiresIn: "7d" }
  );

  return {
    token,
   role: user.role,
   userId: user.userId,
   fullName: user.fullName,
  };
};


const deleteDependent = async (mainUserId, dependentId) => {
    const dependent = await User.findOne({
      where: {
        userId: dependentId,
        parentId: mainUserId,
      },
    });
  
    if (!dependent) {
      return null;
    }
  
    await User.destroy({ where: { userId: dependentId } });
    return true;
  };

const fetchDependentDetails = async (mainUserId, dependentId) => {
  const dependent = await User.findOne({
    where: {
      userId: dependentId,
      parentId: mainUserId,
    },
  });

  if (!dependent) {
    return null;
  }


  return {
    userId: dependent.userId,
    fullName: dependent.fullName,
    gender: dependent.gender,
    dateOfBirth: dependent.dateOfBirth,
}
  }

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






  



  module.exports = {
    createDependent,
    getDependents,
    deleteDependent,
    generateLoginCode,
    loginWithCode,
    fetchDependentDetails,
    updateDependentDetails
    // Add other dependent-related functions here
  };