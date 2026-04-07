const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Load environment based on NODE_ENV
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '..', '..', '.env.backup.production')
  : path.join(__dirname, '..', '..', '.env.dev');

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendBackupEmail(isSuccess, message, filePath = null) {
  try {
    const transporter = getTransporter();
    const toEmail = process.env.SMTP_USER;
    const subject = isSuccess ? '✅ FaithStream Database Backup Successful' : '❌ FaithStream Database Backup Failed';
    const text = `
Hello Admin,

Database Backup Status: ${isSuccess ? 'SUCCESS' : 'FAILED'}
Time: ${new Date().toLocaleString()}

${message}

${filePath ? `Backup File Location: ${filePath}` : ''}

FaithStream System
`;

    await transporter.sendMail({
      from: `"FaithStream Backup" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      text,
    });
    logger.info(`[BackupService] Email notification sent (${isSuccess ? 'Success' : 'Failure'})`);
  } catch (err) {
    logger.error('[BackupService] Failed to send email notification', { error: err.message });
  }
}

function runBackup() {
  return new Promise((resolve, reject) => {
    // Determine the root directory to place the backups folder
    const projectRoot = path.join(__dirname, '..', '..');
    const backupDir = path.join(projectRoot, 'backups');
    
    // Create backups directory if not exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `faithstream_backup_${timestamp}.backup`;
    const filePath = path.join(backupDir, fileName);

    const dbUser = process.env.DB_USER;
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbName = process.env.DB_NAME;
    const dbPassword = process.env.DB_PASSWORD;
    const pgSslMode = (dbHost === 'localhost' || dbHost === '127.0.0.1') ? 'disable' : 'require';

    logger.info(`[BackupService] Starting database backup: ${fileName} targeting host ${dbHost}`);

    // Construct URL-Encoded URI for Supavisor Pooler SNI requirements
    // This avoids shell interpolation bugs with special characters in the password.
    const encodedPassword = encodeURIComponent(dbPassword);
    const dbUri = `postgresql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=${pgSslMode}`;

    const { spawn } = require('child_process');

    const dumpProcess = spawn('pg_dump', [
      '-F', 'c',
      '-d', dbUri,
      '-f', filePath
    ], {
      // Pass clean environment, avoiding PGPASSWORD overriding connection string
      env: { ...process.env, PGPASSWORD: undefined }
    });

    let stderrData = '';

    dumpProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    dumpProcess.on('close', async (code) => {
      if (code !== 0) {
        logger.error('[BackupService] Backup failed', { code, stderr: stderrData });
        await sendBackupEmail(false, `Error running pg_dump (exit code ${code})\n\nStderr: ${stderrData}`);
        return reject(new Error(`pg_dump exited with code ${code}`));
      }

      logger.info(`[BackupService] Local backup successful: ${filePath}`);
      let finalMessage = `Database backup completed successfully.`;

      // If in production, push to S3 and clean up locally
      if (process.env.NODE_ENV === 'production') {
        const s3Util = require('../utils/s3.util');
        try {
          logger.info(`[BackupService] Uploading backup to S3...`);
          const s3Key = await s3Util.uploadDatabaseBackup(filePath, fileName);
          logger.info(`[BackupService] Successfully uploaded backup to S3 at: ${s3Key}`);
          
          finalMessage += `\n\nBackup was securely uploaded to AWS S3: ${s3Key}`;
          
          const downloadUrl = s3Util.getSignedUrl(s3Key);
          finalMessage += `\nTemporary Direct Download Link (Valid for 24h):\n${downloadUrl}`;
          
          fs.unlinkSync(filePath);
          logger.info(`[BackupService] Cleaned up local backup file from server.`);
          finalMessage += `\n\n(Local copy deleted from production server to save space)`;
        } catch (s3Error) {
          logger.error(`[BackupService] Failed to upload backup to S3`, { error: s3Error.message });
          finalMessage += `\n\nWARNING: Failed to upload to AWS S3: ${s3Error.message}`;
        }
      }

      await sendBackupEmail(true, finalMessage, process.env.NODE_ENV === 'production' ? null : filePath);
      resolve(filePath);
    });
  });
}

function initBackupCron() {
  // Schedule to run exactly at 03:00 AM IST regardless of server timezone
  cron.schedule('0 3 * * *', async () => {
    logger.info('[Cron] Triggering daily database backup (03:00 AM IST)');
    try {
      await runBackup();
    } catch (err) {
      logger.error('[Cron] Database backup failed', { error: err.message });
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  logger.info('[BackupService] Daily backup cron scheduled at 03:00 AM IST');
}

module.exports = {
  initBackupCron,
  runBackup
};
