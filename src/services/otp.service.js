const nodemailer = require('nodemailer');
const db = require('../config/db');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.generateAndSendOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.query(
    `INSERT INTO advertiser_otps (email, otp_code, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE 
     SET otp_code = $2, expires_at = $3`,
    [email, otp, expiresAt]
  );

  const mailOptions = {
    from: `"FaithStream Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Advertiser Registration OTP',
    text: `Your OTP for advertiser registration is: ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>FaithStream Advertiser Portal</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #388bfd; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
};

exports.verifyOTP = async (email, otp) => {
  const res = await db.query(
    `SELECT * FROM advertiser_otps WHERE email = $1 AND otp_code = $2 AND expires_at > NOW()`,
    [email, otp]
  );
  
  if (res.rows.length === 0) {
    throw new Error('Invalid or expired OTP');
  }

  // Delete OTP after verification
  await db.query(`DELETE FROM advertiser_otps WHERE email = $1`, [email]);
  return true;
};
