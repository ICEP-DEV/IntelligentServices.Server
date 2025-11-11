import express from 'express';
import { Citizen, Admin, MunicipalPersonnel } from '../model/user.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authenticateToken from '../middlewares/authenticateToken.js';

const router = express.Router();

// ----------------------
// Multer setup for profile pics
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/profilePics';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  },
});

// ----------------------
// Helper: Find user from any table and return role
// ----------------------
async function findUserById(id) {
  let user = await Citizen.findByPk(id);
  if (user) return { user, role: 'citizen' };

  user = await Admin.findByPk(id);
  if (user) return { user, role: 'admin' };

  user = await MunicipalPersonnel.findByPk(id);
  if (user) return { user, role: 'municipalPersonnel' };

  return null;
}

// ----------------------
// Get user profile (✅ includes role now)
// ----------------------
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.user;
    const result = await findUserById(id);

    if (!result) return res.status(404).json({ error: 'User not found' });

    const { user, role } = result;

    res.status(200).json({
      user: {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        location: user.locationAddress || user.region || null,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
        role, // 🟩 added role here
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------
// Update user profile
// ----------------------
router.put(
  '/update',
  authenticateToken,
  upload.single('profilePic'),
  async (req, res) => {
    try {
      const { email, firstname, lastname, location, phoneNumber } = req.body;

      if (!email || !firstname || !lastname) {
        return res
          .status(400)
          .json({ error: 'Email, first name and last name are required.' });
      }
      if (/\d/.test(firstname) || /\d/.test(lastname)) {
        return res
          .status(400)
          .json({ error: 'First and last name cannot contain numbers.' });
      }

      const result = await findUserById(req.user.id);
      if (!result) return res.status(404).json({ error: 'User not found' });

      const { user } = result;

      // Email uniqueness check across all 3 tables
      //  const existing =
      //  (await Citizen.findOne({ where: { email } })) ||
      //  (await Admin.findOne({ where: { email } })) ||
      //  (await MunicipalPersonnel.findOne({ where: { email } }));

      // if (existing && existing.id !== req.user.id) {
      //  return res.status(409).json({ error: 'Email already in use.' });
      // }

      // Handle uploaded file
      let profilePicPath = user.profilePic;
      if (req.file) {
        profilePicPath = `/uploads/profilePics/${req.file.filename}`;
      }

      // Detect model type
      const updateData = {
        email,
        firstname,
        lastname,
        phoneNumber,
        profilePic: profilePicPath,
      };

      if (user instanceof Citizen) updateData.locationAddress = location;
      else updateData.region = location;

      await user.update(updateData);

      res.status(200).json({
        message: 'Profile updated successfully',
        profilePic: user.profilePic,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ----------------------
// Upload profile picture
// ----------------------
router.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const result = await findUserById(req.user.id);
    if (!result) return res.status(404).json({ error: 'User not found' });

    const { user } = result;

    user.profilePic = `/uploads/profilePics/${req.file.filename}`;
    await user.save();

    res.json({ message: 'Profile picture uploaded', profilePic: user.profilePic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------
// Delete user profile (✅ restricted by role)
// ----------------------
router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    const result = await findUserById(req.user.id);
    if (!result) return res.status(404).json({ error: 'User not found' });

    const { user, role } = result;

    // 🛑 Only Admins and Citizens can delete — technicians (MunicipalPersonnel) are blocked
    if (role === 'municipalPersonnel') {
      return res
        .status(403)
        .json({ error: 'Municipal personnel are not allowed to delete their profile.' });
    }

    await user.destroy();
    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
