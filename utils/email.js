import nodemailer from 'nodemailer';

async function sendEmail(title="Password reset",email,username,message, resetMsg="") {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: title,
    html: `<p>Hi ${username},</p>
           <p>${message}</p>
           <p>${resetMsg}</p>
           <p>If you did not request this, please ignore this email.</p>`
  };

  await transporter.sendMail(mailOptions);
  console.log(`Password reset email sent to ${email}, reset: ${resetMsg}`);
}

export default sendEmail;