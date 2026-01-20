import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(
  title = "Password reset",
  email,
  username,
  message,
  resetMsg = ""
) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: title,
    html: `
      <p>Hi ${username},</p>
      <p>${message}</p>
      <p>${resetMsg}</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}

export default sendEmail;
