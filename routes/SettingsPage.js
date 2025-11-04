import express from 'express';
import { Citizen } from '../model/user.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

const router = express.Router();

// Get citizen profile
router.get("/citizen/profile", authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;

    // Check if user is a citizen
    if (role !== "citizen") {
      return res.status(403).json({ error: "Access denied. Citizens only." });
    }

    const user = await Citizen.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.citizen_id, // Use citizen_id instead of id
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      location: user.locationAddress, // Use locationAddress from registration
      phone: user.phone,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update citizen profile
router.put("/citizen/update", authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;

    // Check if user is a citizen
    if (role !== "citizen") {
      return res.status(403).json({ error: "Access denied. Citizens only." });
    }

    const { email, firstname, lastname, location, phone } = req.body;

    // Validation
    if (!email || !firstname || !lastname) {
      return res.status(400).json({ error: "Email, first name, and last name are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Name validation (no numbers)
    const hasNumber = (str) => /\d/.test(str);
    if (hasNumber(firstname) || hasNumber(lastname)) {
      return res.status(406).json({ error: 'Invalid input! A name cannot contain numbers!' });
    }

    const user = await Citizen.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is already taken by another user
    const existingUser = await Citizen.findOne({ 
      where: { 
        email: email,
        citizen_id: { [Op.ne]: id } // Use citizen_id instead of id
      } 
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email is already taken" });
    }

    await user.update({ 
      email, 
      firstname, 
      lastname, 
      locationAddress: location, // Map location to locationAddress
      phone 
    });

    // Return updated user data without password
    const updatedUser = await Citizen.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ 
      message: "Profile updated successfully",
      user: {
        id: updatedUser.citizen_id,
        email: updatedUser.email,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        location: updatedUser.locationAddress,
        phone: updatedUser.phone,
        profilePic: updatedUser.profilePic,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete citizen profile
router.delete("/citizen/delete", authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;

    // Check if user is a citizen
    if (role !== "citizen") {
      return res.status(403).json({ error: "Access denied. Citizens only." });
    }

    const user = await Citizen.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.destroy();

    res.json({ 
      message: "Profile deleted successfully" 
    });
  } catch (error) {
    console.error("Profile deletion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update profile picture
router.put("/citizen/profile-picture", authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role !== "citizen") {
      return res.status(403).json({ error: "Access denied. Citizens only." });
    }

    const { profilePic } = req.body;

    const user = await Citizen.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.update({ profilePic });

    res.json({ 
      message: "Profile picture updated successfully",
      profilePic: profilePic
    });
  } catch (error) {
    console.error("Profile picture update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change password
router.put("/citizen/change-password", authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role !== "citizen") {
      return res.status(403).json({ error: "Access denied. Citizens only." });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    // Use the same password validation as registration
    const validatePassword = (password) => {
      const lengthCheck = password.length >= 6;
      const uppercaseCheck = /[A-Z]/.test(password);
      const digitCheck = /\d/.test(password);
      const symbolCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      return lengthCheck && uppercaseCheck && digitCheck && symbolCheck;
    };

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters, include 1 uppercase, 1 digit, 1 symbol' });
    }

    const user = await Citizen.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;