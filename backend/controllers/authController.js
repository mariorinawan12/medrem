const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");
const user = require("../models/user");
const User = db.User;
const sendEmail = require('../utils/sendEmail');
const { Op } = require("sequelize");


const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

const signup = async (req, res) => {
  try {
    const { email, password, fullName, gender, dateOfBirth, age } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email, // Just provide email, password, and role, as `userId` is auto-incremented
      password: hashedPassword,
      fullName,
      gender,
      dateOfBirth,
      age,
      role: "main_user",
    });

    const token = jwt.sign({ userId: user.userId, role: user.role }, SECRET_KEY, { expiresIn: "7d" });

    res.json({ message: "User created", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.userId, role: user.role }, SECRET_KEY, { expiresIn: "7d" });

    res.json({ token, role: user.role, name: user.fullName, userId: user.userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  await user.update({ resetCode, resetCodeExpiresAt });

  await sendEmail(email, `Your password reset code is: ${resetCode}`);
  return res.status(200).json({ message: 'Reset code sent', success: true });

}

const verifyResetCode = async (req, res) => {
  const { resetCode } = req.body;

  const user = await User.findOne({
    where: {
      resetCode,
      resetCodeExpiresAt: { [Op.gt]: new Date() },
    },
  });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset code" });
  }

  const resetToken = jwt.sign({ userId: user.userId }, SECRET_KEY, { expiresIn: "15m" });

  return res.json({ message: "Reset code verified", resetToken });
};

const resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Reset token required in Authorization header' });
    }

    const resetToken = authHeader.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(resetToken, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    const { userId } = payload;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      resetCode: null,
      resetCodeExpiresAt: null,
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateFcmToken = async (req, res) => {
  try {
    console.log("Updating FCM token...");
    const userId = req.user.userId;

    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get current tokens (handle string (old), array (new), or null)
    let currentTokens = [];
    if (Array.isArray(user.fcmToken)) {
      currentTokens = user.fcmToken;
    }
    // Check if it's a string (old format or double-stringified)
    else if (typeof user.fcmToken === 'string') {
      try {
        const parsed = JSON.parse(user.fcmToken);
        if (Array.isArray(parsed)) {
          currentTokens = parsed;
        } else {
          currentTokens = [user.fcmToken];
        }
      } catch (e) {
        currentTokens = [user.fcmToken];
      }
    }

    // Only add if token doesn't already exist
    if (!currentTokens.includes(fcmToken)) {
      const updatedTokens = [...currentTokens, fcmToken];
      await user.update({ fcmToken: updatedTokens });
      console.log(`[FCM] Added new token for user ${userId}. Total tokens: ${updatedTokens.length}`);
    } else {
      console.log(`[FCM] Token already exists for user ${userId}`);
    }

    return res.json({ message: "FCM token updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const fetchUserDetails = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming userId is set in the request by auth middleware
    const user = await User.findByPk(userId, {
      attributes: ['email', 'fullName', 'gender', 'dateOfBirth']
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user });
  }
  catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

const updateUserDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, gender, dateOfBirth } = req.body;

    // Update using Sequelize's update method
    const [updatedCount] = await User.update(
      {
        fullName,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
      },
      {
        where: { userId },
        returning: true // For PostgreSQL to return the updated record
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch the updated user
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // Don't return password
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const unregisterFcmToken = async (req, res) => {
  try {
    console.log("Unregistering FCM token...");
    const userId = req.user.userId;
    const { fcmToken } = req.body; // Token to remove (from this specific device)

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get current tokens (handle string (old), array (new), or null)
    let currentTokens = [];
    if (Array.isArray(user.fcmToken)) {
      currentTokens = user.fcmToken;
    } else if (typeof user.fcmToken === 'string') {
      try {
        const parsed = JSON.parse(user.fcmToken);
        if (Array.isArray(parsed)) {
          currentTokens = parsed;
        } else {
          currentTokens = [user.fcmToken];
        }
      } catch (e) {
        currentTokens = [user.fcmToken];
      }
    }

    // Remove the specific token
    if (fcmToken) {
      const updatedTokens = currentTokens.filter(t => t !== fcmToken);
      await user.update({ fcmToken: updatedTokens });
      console.log(`[FCM] Removed token for user ${userId}. Remaining tokens: ${updatedTokens.length}`);
    } else {
      // If no token provided, clear all (backward compatibility)
      await user.update({ fcmToken: [] });
      console.log(`[FCM] Cleared all tokens for user ${userId}`);
    }

    return res.json({ message: "FCM token unregistered successfully" });
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = { signup, login, forgotPassword, verifyResetCode, resetPassword, updateFcmToken, fetchUserDetails, updateUserDetails, unregisterFcmToken };
