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

/**
 * Send login credentials to a newly created artist account
 */
exports.sendArtistCredentials = async ({ name, email, password }) => {
  const portalUrl = process.env.ADMIN_HUB_URL || 'http://localhost:5173';

  const mailOptions = {
    from: `"FaithStream" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to FaithStream — Your Artist Account Is Ready!',
    text: `Hi ${name},\n\nYour FaithStream artist account has been created.\n\nLogin URL: ${portalUrl}\nEmail: ${email}\nPassword: ${password}\n\nYou can use these same credentials on the FaithStream mobile app.\n\nWelcome aboard!\n— FaithStream Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #333;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #e8960c; margin: 0;">FaithStream</h1>
          <p style="color: #666; margin: 4px 0 0;">Artist Upload Portal</p>
        </div>

        <p>Hi <strong>${name}</strong>,</p>
        <p>Your FaithStream artist account is ready. You can now log in to upload your albums and songs.</p>

        <div style="background: #f5f5f5; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 12px; font-weight: bold; color: #333;">Your Login Details:</p>
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
              <td style="padding: 6px 0; color: #666;">Password</td>
              <td style="padding: 6px 0; font-weight: bold; font-family: monospace; font-size: 16px;">${password}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fff8e1; border-left: 4px solid #e8960c; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px;">
            💡 <strong>Tip:</strong> These same credentials work on the FaithStream mobile app too.
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

