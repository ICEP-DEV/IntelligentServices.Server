import express from 'express';
import bcrypt from 'bcrypt';
import { Citizen } from '../model/user.js';
import { isEmailTaken } from '../utils/FindEmail.js';
import { createAndSendOTP } from '../controllers/VerificationController.js'; // adjust path

const router = express.Router();

function validatePassword(password) {
  const lengthCheck = password.length >= 6;
  const uppercaseCheck = /[A-Z]/.test(password);
  const digitCheck = /\d/.test(password);
  const symbolCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return lengthCheck && uppercaseCheck && digitCheck && symbolCheck;
}

const hasNumber = (str) => /\d/.test(str);

router.post('/register/citizen', async (req, res) => {
  const { email, password, firstname, lastname, locationAddress } = req.body;

  // Check if email exists in any table
  const exists = await isEmailTaken(email);
  if (exists) return res.status(400).json({ error: "Email already exists" });

  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if(hasNumber(firstname) || hasNumber(lastname)) return res.status(406).json({ error: ' Invalid input ! , A name can not be a number  !!!'})
  if (!validatePassword(password)) return res.status(400).json({ error: 'Password at least 6 characters, include 1 uppercase, 1 digit, 1 symbol' });

  try {
    const exists = await Citizen.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await Citizen.create({ 
      email,
      password: hashPassword, 
      firstname, 
      lastname, 
      locationAddress, 
      is_Verified: false 
    });

    // Generate OTP for the new user
    await createAndSendOTP(newUser.citizen_id);

    res.status(201).json({ 
        message: 'Citizen registered successfully. OTP sent to your email for verification.',
        user: { id: newUser.citizen_id, email: newUser.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export { validatePassword };
export default router;
