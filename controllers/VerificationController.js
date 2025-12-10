import { Citizen, Admin, MunicipalPersonnel } from '../model/user.js';
import sendEmail from '../utils/email.js';
import jwt from 'jsonwebtoken';

const otpStore = new Map();
const profileChangeStore = new Map();

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

// Generate OTP for profile change
export const generateProfileChangeOTP = async (req, res) => {
    const { id, role } = req.user;
    const { email, firstname, lastname, location, phone } = req.body;

    if (!email && !firstname && !lastname && !location && !phone) {
        return res.status(400).json({ message: 'At least one field must be provided for update' });
    }

    let userModel, userIdField;
    if (role === "citizen") {
        userModel = Citizen;
        userIdField = 'citizen_id';
    } else if (role === "admin") {
        userModel = Admin;
        userIdField = 'admin_id';
    } else if (role === "municipal") {
        userModel = MunicipalPersonnel;
        userIdField = 'municipal_id';
    } else {
        return res.status(400).json({ message: 'Invalid user role' });
    }

    const user = await userModel.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Clear existing OTP if any
    if (profileChangeStore.has(id)) {
        clearTimeout(profileChangeStore.get(id).timeoutId);
    }

    // Store pending changes and OTP
    const timeoutId = setTimeout(() => profileChangeStore.delete(id), 10 * 60 * 1000);
    profileChangeStore.set(id, {
        otp,
        timeoutId,
        changes: { email, firstname, lastname, location, phone },
        role
    });

    console.log(`Profile change OTP for ${id}: ${otp}`);

    // Send OTP via email
    await sendEmail(
        "Profile Change Verification",
        user.email,
        otp,
        user.firstname || user.email,
        `Your profile change verification code is <b>${otp}</b>. It expires in 10 minutes.`
    );

    res.json({ message: 'OTP generated and sent to your email for profile change verification.' });
};

// Verify OTP and apply profile changes
export const verifyProfileChangeOTP = async (req, res) => {
    const { id } = req.user;
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    const record = profileChangeStore.get(id);
    if (!record) return res.status(400).json({ message: 'No pending profile change found or OTP has expired.' });

    if (parseInt(otp) === record.otp) {
        clearTimeout(record.timeoutId);
        profileChangeStore.delete(id);

        let userModel;
        if (record.role === "citizen") userModel = Citizen;
        else if (record.role === "admin") userModel = Admin;
        else if (record.role === "municipal") userModel = MunicipalPersonnel;

        const user = await userModel.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Apply changes
        const { email, firstname, lastname, location, phone } = record.changes;
        await user.update({ email, firstname, lastname, location, phone });

        return res.json({ message: 'Profile updated successfully' });
    }

    res.status(400).json({ message: 'Invalid OTP' });
};
