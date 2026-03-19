const nodemailer = require('nodemailer');
const db = require('../config/db');
const redisClient = require('../config/redis');
const { randomInt } = require('crypto');

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
  const otp = randomInt(100000, 1000000).toString();
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

// =========================================================================
// Generic OTP Services (Redis-backed for general app users / artists / reset)
// =========================================================================

/**
 * Generates an OTP, stores it in Redis with a 10-minute expiry, and emails the user.
 * @param {string} email - The target email address
 * @param {string} purpose - A namespace string (e.g., 'register', 'reset_password')
 * @param {string} title - The email subject title
 * @param {string} description - The descriptive text explaining the purpose
 */
exports.generateAndSendGenericOTP = async (email, purpose, title, description) => {
  const otp = randomInt(100000, 1000000).toString();
  
  // Store OTP in Redis (10 mins = 600 seconds)
  const redisKey = `otp:${purpose}:${email}`;
  await redisClient.setEx(redisKey, 600, otp);
  
  // Maintain a rate-limit counter to prevent abuse (optional but good practice)
  const attemptsKey = `otp_attempts:${purpose}:${email}`;
  await redisClient.setEx(attemptsKey, 600, "0"); // Reset failed attempts

  const mailOptions = {
    from: `"FaithStream Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: title,
    text: `${description} Your OTP is: ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
           <h1 style="color: #e8960c; margin: 0;">FaithStream</h1>
        </div>
        <h2 style="font-size: 20px;">${title}</h2>
        <p style="font-size: 16px;">${description}</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <h1 style="color: #388bfd; margin: 0; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p style="font-size: 14px;">This code expires in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
};

/**
 * Verifies a Redis-backed generic OTP. Automatically deletes it upon successful verification.
 * @param {string} email - The target email address
 * @param {string} otp - The 6-digit OTP code provided by the user
 * @param {string} purpose - A namespace string (e.g., 'register', 'reset_password')
 * @returns {boolean} - True if valid, throws error otherwise
 */
exports.verifyGenericOTP = async (email, otp, purpose) => {
  const redisKey = `otp:${purpose}:${email}`;
  const attemptsKey = `otp_attempts:${purpose}:${email}`;

  const storedOtp = await redisClient.get(redisKey);
  
  if (!storedOtp) {
    throw new Error('OTP has expired or does not exist. Please request a new one.');
  }

  // Check rate limits
  const attempts = await redisClient.incr(attemptsKey);
  if (attempts > 5) {
    // Lock them out of this specific OTP after 5 fails to prevent brute force
    await redisClient.del(redisKey);
    throw new Error('Too many failed attempts. OTP invalidated. Please request a new one.');
  }

  if (storedOtp !== otp) {
    throw new Error('Invalid OTP code.');
  }

  // OTP verified successfully! Clean it up so it can't be reused.
  await redisClient.del(redisKey);
  await redisClient.del(attemptsKey);
  
  return true;
};

