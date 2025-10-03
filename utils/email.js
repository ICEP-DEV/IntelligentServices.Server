import nodemailer from 'nodemailer';

async function sendEmail(title="Password reset",email, token, username,message) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: title,
    html: `<p>Hi ${username},</p>
           <p>${message}</p>
           <a href="${resetLink}">Reset Password</a>
           <p>If you did not request this, please ignore this email.</p>`
  };

  await transporter.sendMail(mailOptions);
  console.log(`Password reset email sent to ${email}`);
  console.log(`Token: ${token}`);
}

export default sendEmail;