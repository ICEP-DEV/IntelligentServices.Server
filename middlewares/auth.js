// auth.ts
import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const auth = betterAuth({
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          const mailOptions = {
            from: `"BetterAuth OTP" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Your ${type} OTP Code`,
            text: `Your OTP code is ${otp}. It will expire in a few minutes.`,
          };

          await transporter.sendMail(mailOptions);
          console.log(`OTP ${otp} sent to ${email} for ${type}`);
        } catch (err) {
          console.error('Error sending OTP email:', err);
          throw new Error('Failed to send OTP');
        }
      },
    }),
  ],
});
