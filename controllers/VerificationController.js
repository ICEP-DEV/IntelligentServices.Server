import { Citizen, Admin, MunicipalPersonnel } from '../model/user.js';
import Otp from '../model/otp.js';
import sendEmail from '../utils/email.js';
import jwt from 'jsonwebtoken';


async function createAndSendOTP(userId) {
  const citizen = await Citizen.findByPk(userId);
  if (!citizen) throw new Error("User not found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);

  const existingOtp = await Otp.findOne({
    where: { user_id: userId, role: 'citizen', type: 'verification' }
  });

  if (existingOtp) {
    await existingOtp.update({ otp, expires_at });
  } else {
    await Otp.create({
      user_id: userId,
      role: 'citizen',
      email: citizen.email,
      otp,
      expires_at,
      type: 'verification'
    });
  }

  await sendEmail(
    "Account Verification",
    citizen.email,
    citizen.firstname || citizen.email,
    `Your verification code is <b>${otp}</b>. It expires in 10 minutes.`
  );
}

// generate otp
export const generateOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    await createAndSendOTP(userId);
    res.json({ message: 'OTP generated and sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate OTP' });
  }
};

// verify otp
export const verifyOTPAndLogin = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'OTP required!' });

    const record = await Otp.findOne({ where: { user_id: userId, role: 'citizen', type: 'login' } });
    if (!record) return res.status(400).json({ message: 'No OTP found for this user.' });

    if (record.expires_at < new Date()) {
        return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (record.otp !== otp.toString()) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }


    //Otp is valid delete it prevent reuse
    await record.destroy({force: true});

    const citizen = await Citizen.findByPk(userId);
    if (!citizen) return res.status(404).json({ message: 'User not found' });
    citizen.is_Verified = true;
    await citizen.save();
    const token = jwt.sign(
        { id: citizen.citizen_id, email: citizen.email, role: 'citizen', is_Verified: citizen.is_Verified },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return res.json({
        message: 'OTP verified successfully. Account is now active.',
        token,
    });
}

// Generate OTP for profile change
export const generateProfileChangeOTP = async (req, res) => {
    const { id, role } = req.user;
    const { email, firstname, lastname, location, phone } = req.body.profile;

    if (!email && !firstname && !lastname && !location && !phone) {
        return res.status(400).json({ message: 'At least one field must be provided for update' });
    }

    let userModel;
    if (role === "citizen") {
        userModel = Citizen;
    } else if (role === "admin") {
        userModel = Admin;
    } else if (role === "municipal") {
        userModel = MunicipalPersonnel;
    } else {
        return res.status(400).json({ message: 'Invalid user role' });
    }

    const user = await userModel.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({ profileVerified: false });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    const existingOtp = await Otp.findOne({ where: { user_id: id, role, type: 'profile_change' } });
    const metadata = { email, firstname, lastname, location, phone };

    if (existingOtp) {
        await existingOtp.update({ otp, expires_at, metadata, email: user.email });
    } else {
        await Otp.create({
            user_id: id,
            role,
            email: user.email,
            otp,
            expires_at,
            type: 'profile_change',
            metadata
        });
    }

    console.log(`Profile change OTP for ${id}: ${otp}`);

    await sendEmail(
        "Profile Change Verification",
        user.email,
        otp,
        user.firstname || user.email,
        `Your profile change verification code is <b>${otp}</b>. It expires in 10 minutes.`
    );
    console.log(user.email,": opt(",otp,")");
    res.json({ message: 'OTP generated and sent to your email for profile change verification.' });
};

// Verify OTP and apply profile changes
export const verifyProfileChangeOTP = async (req, res) => {
    const { id, role } = req.user;
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    const record = await Otp.findOne({ where: { user_id: id, role, type: 'profile_change', otp: otp.toString() } });
    if (!record) return res.status(400).json({ message: 'No pending profile change found or OTP is invalid.' });

    if (record.expires_at < new Date()) return res.status(400).json({ message: 'OTP has expired.' });

    let userModel;
    if (role === "citizen") userModel = Citizen;
    else if (role === "admin") userModel = Admin;
    else if (role === "municipal") userModel = MunicipalPersonnel;

    const user = await userModel.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { email, firstname, lastname, location, phone } = record.metadata;
    const updates = {};
    if (email) updates.email = email;
    if (firstname) updates.firstname = firstname;
    if (lastname) updates.lastname = lastname;
    if (phone) updates.phoneNumber = phone;
    if (location) {
        if (role === "citizen") updates.locationAddress = location;
        else updates.region = location;
    }

    await user.update({ ...updates, profileVerified: true });
    await record.destroy({ force: true });

    return res.json({ message: 'Profile updated successfully' });
};
