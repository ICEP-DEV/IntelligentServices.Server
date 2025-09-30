import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Citizen, Admin, MunicipalPersonnel } from '../models/user.js';
import { validatePassword } from './register.js';
import sendEmail from '../utils/email.js';

const router = express.Router();


async function findUserByEmail(email) {
  return await Citizen.findOne({ where: { email } }) 
      || await Admin.findOne({ where: { email } }) 
      || await MunicipalPersonnel.findOne({ where: { email } });
}


router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userId = user.citizen_id || user.admin_id || user.municipality_id;
    const role = user.isSuperAdmin ? 'superadmin' : user.role || 'citizen';

    const token = jwt.sign({ id: userId, email: user.email, role }, process.env.JWT_SECRET, { expiresIn: '10m' });
    sendEmail("Password reset",user.email,token,user.firstname,"Your password reset link is provided below ,note this link expires after 5 minutes");
    res.status(200).json({ message: 'Password reset link sent' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Token and new password required' });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and include 1 uppercase, 1 digit, 1 symbol' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await findUserByEmail(decoded.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt());
    user.password = hashPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    console.error(error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router
