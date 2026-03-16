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
    `INSERT INTO advertiser_otps (email, otp_code, expires_at, failed_attempts, is_verified)
     VALUES ($1, $2, $3, 0, false)
     ON CONFLICT (email) DO UPDATE 
     SET otp_code = $2, expires_at = $3, failed_attempts = 0, is_verified = false`,
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
  const recordRes = await db.query(`SELECT * FROM advertiser_otps WHERE email = $1`, [email]);
  
  if (recordRes.rows.length === 0) {
    throw new Error('No OTP found for this email. Please request a new one.');
  }

  const record = recordRes.rows[0];

  if (record.is_verified) {
    return true; // Already verified
  }

  if (record.failed_attempts >= 5) {
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new Error('OTP has expired. Please request a new one.');
  }

  if (record.otp_code !== otp) {
    await db.query(`UPDATE advertiser_otps SET failed_attempts = failed_attempts + 1 WHERE email = $1`, [email]);
    throw new Error('Invalid OTP');
  }

  // Mark as verified instead of deleting immediately so register() can check it later
  await db.query(`UPDATE advertiser_otps SET is_verified = true WHERE email = $1`, [email]);
  return true;
};

exports.isEmailVerified = async (email) => {
  const res = await db.query(`SELECT is_verified FROM advertiser_otps WHERE email = $1`, [email]);
  return res.rows.length > 0 && res.rows[0].is_verified;
};

exports.clearOTP = async (email) => {
  await db.query(`DELETE FROM advertiser_otps WHERE email = $1`, [email]);
};

/**
 * Send login credentials to a newly created artist account
 */
exports.sendArtistCredentials = async ({ name, email, password }) => {
  const portalUrl = process.env.ADMIN_HUB_URL;

  const mailOptions = {
    from: `"FaithStream" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to FaithStream — Your Artist Account Is Ready!',
    text: `Hi ${name},\n\nYour FaithStream artist account has been created.\n\nLogin URL: ${portalUrl}\nEmail: ${email}\nTemporary Password: ${password}\n\n⚠️ IMPORTANT: Please log in and change your password immediately to secure your account.\n\nWelcome aboard!\n— FaithStream Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #333;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #e8960c; margin: 0;">FaithStream</h1>
          <p style="color: #666; margin: 4px 0 0;">Artist Upload Portal</p>
        </div>

        <p>Hi <strong>${name}</strong>,</p>
        <p>Your FaithStream artist account is ready. You can now log in to upload your albums and songs.</p>

        <div style="background: #f5f5f5; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 12px; font-weight: bold; color: #333;">Your Temp Login Details:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 100px;">Portal URL</td>
              <td style="padding: 6px 0;"><a href="${portalUrl}" style="color: #e8960c;">${portalUrl}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Email</td>
              <td style="padding: 6px 0; font-weight: bold;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #666;">Temp Password</td>
              <td style="padding: 6px 0; font-weight: bold; font-family: monospace; font-size: 16px;">${password}</td>
            </tr>
          </table>
        </div>

        <div style="background: #ffebe8; border-left: 4px solid #d9534f; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #d9534f;">
            <strong>⚠️ IMPORTANT:</strong> This is a temporary, auto-generated password. Please log in and change your password immediately to secure your account.
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          Welcome aboard! If you have any trouble logging in, please contact your admin.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          FaithStream — Christian Music Platform
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

