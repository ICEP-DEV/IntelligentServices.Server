import { Citizen } from '../model/user.js';
import sendEmail from '../utils/email.js';
import jwt from 'jsonwebtoken';

const otpStore = new Map(); 

export const generateOTP = async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const citizen = await Citizen.findByPk(userId);
    if (!citizen) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000);

    
    if (otpStore.has(userId)) {
        clearTimeout(otpStore.get(userId).timeoutId);
    }

    
    const timeoutId = setTimeout(() => otpStore.delete(userId), 10 * 60 * 1000);

    otpStore.set(userId, { otp, timeoutId });
    console.log(`OTP for ${userId}: ${otp}`);

    // Send OTP via email
    await sendEmail(
        "Account Verification",
        citizen.email,
        otp, 
        citizen.firstname || citizen.email,
        `Your verification code is <b>${otp}</b>. It expires in 10 minutes.`
    );

    res.json({ message: 'OTP generated and sent to your email.' });
};

// verify otp
export const verifyOTPAndLogin = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'User ID and OTP required' });

    const record = otpStore.get(userId);
    if (!record) return res.status(400).json({ message: 'No OTP found for this user or it has expired.' });

    if (parseInt(otp) === record.otp) {
        clearTimeout(record.timeoutId);
        otpStore.delete(userId);

        const citizen = await Citizen.findByPk(userId);
        if (!citizen) return res.status(404).json({ message: 'User not found' });

        citizen.is_Verified = true;
        await citizen.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: citizen.citizen_id, email: citizen.email, role: 'citizen' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({ 
            message: 'OTP verified successfully. Account is now active.', 
            token, 
            user: { id: citizen.citizen_id, email: citizen.email } 
        });
    }

    res.status(400).json({ message: 'Invalid OTP' });
};