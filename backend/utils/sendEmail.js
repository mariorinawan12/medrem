const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,     // Your email (e.g., your Gmail)
    pass: process.env.EMAIL_PASS,     // App password (NOT your actual password)
  },
});

// Send email function
const sendEmail = async (to, code) => {
  const mailOptions = {
    from: `"Medication Reminder App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="color: #2E86C1;">Medication Reminder App</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">
          You recently requested to reset your password. Please use the code below to proceed:
        </p>
        <div style="font-size: 24px; font-weight: bold; color: #2E86C1; text-align: center; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 14px; color: #777;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="margin-top: 30px;"/>
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          &copy; ${new Date().getFullYear()} Medication Reminder App. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email sending failed:', err);
    throw new Error('Failed to send email');
  }
};


module.exports = sendEmail;
