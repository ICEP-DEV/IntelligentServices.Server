import express from 'express';
import { auth } from '../middlewares/auth.js'; 
import { upload } from '../middlewares/upload.js';
import { Citizen } from '../model/user.js';
import authenticateToken from '../middlewares/authenticateToken.js';

const router = express.Router();

// ===============================
// GET logged-in user
// ===============================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const sessionUser = req.auth.user; // From BetterAuth session

    const citizen = await Citizen.findOne({
      where: { email: sessionUser.email },
    });

    if (!citizen) {
      return res.status(404).json({ message: 'Citizen not found' });
    }

    res.json({
      firstName: citizen.firstname,
      lastName: citizen.lastname,
      email: citizen.email,
      profilePic: citizen.profile_pic || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// UPLOAD profile picture
// ===============================
router.post(
  '/me/profile-pic',
  authenticateToken,          // <--- FIXED HERE
  upload.single('profilePic'),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: 'No file uploaded' });

      const sessionUser = req.auth.user;

      const citizen = await Citizen.findOne({
        where: { email: sessionUser.email },
      });

      if (!citizen) {
        return res.status(404).json({ message: 'Citizen not found' });
      }

      // Save file
      citizen.profile_pic = req.file.filename;
      await citizen.save();

      res.json({
        message: 'Profile picture updated',
        profilePic: req.file.filename,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
