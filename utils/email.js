import nodemailer from 'nodemailer';

async function sendEmail(title="Password reset",email,username,message, resetMsg="") {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', 
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
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
  try {
  await transporter.sendMail(mailOptions);
  console.log(`Password reset email sent to ${email}, reset: ${resetMsg}`);
  return true;
  } catch(err) {
    console.error("Email Sending Errror: ", err);
    throw new error("Email Service Timeout or Auth failure");
  }
}

export default sendEmail;
