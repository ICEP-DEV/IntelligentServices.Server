import nodemailer from 'nodemailer';

async function sendEmail(title="Password reset",email,username,message, resetMsg="") {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', 
    port: 465,
    secure: true,
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
  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
}

export default sendEmail;
