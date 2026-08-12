const nodemailer = require("nodemailer");

async function createTransporter() {
  if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  console.warn(
    "EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS not configured. Password reset links will be logged to the console."
  );

  return {
    sendMail: async (mailOptions) => {
      console.log("[Password reset email]", mailOptions);
      return Promise.resolve();
    },
  };
}

async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const transporter = await createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@blogapp.local",
    to: email,
    subject: "Password Reset Request",
    html: `
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the link below to choose a new password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
