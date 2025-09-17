import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Citizen, Admin, MunicipalPersonnel } from '../models/user.js';

const router = express.Router();

function validatePassword(password) {
  const lengthCheck = password.length >= 6;
  const uppercaseCheck = /[A-Z]/.test(password);
  const digitCheck = /\d/.test(password);
  const symbolCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return lengthCheck && uppercaseCheck && digitCheck && symbolCheck;
}


router.post('/register/citizen', async (req, res) => {
  const { email, password, firstname, lastname, locationAddress } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!validatePassword(password)) return res.status(400).json({ error: 'Password at least 6 characters, include 1 uppercase, 1 digit, 1 symbol' });

  try {
    const exists = await Citizen.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    const hashPassword = await bcrypt.hash(password,10);
    console.log("hashed: ", hashPassword)
    const newUser = await Citizen.create({ email,password: hashPassword, firstname, lastname, locationAddress });

    const token = jwt.sign({ id: newUser.citizen_id, email: newUser.email, role: 'citizen' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'Citizen registered successfully', token, user: { id: newUser.citizen_id, email: newUser.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export {validatePassword}
export default router 
