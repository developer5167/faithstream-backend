const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
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
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME;
    const dbPassword = process.env.DB_PASSWORD || '';

    // pg_dump command (custom format is recommended for pg_restore)
    const command = `pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -F c -d ${dbName} -f "${filePath}"`;

    logger.info(`[BackupService] Starting database backup: ${fileName}`);

    exec(command, { env: { ...process.env, PGPASSWORD: dbPassword } }, async (error, stdout, stderr) => {
      if (error) {
        logger.error('[BackupService] Backup failed', { error: error.message, stderr });
        await sendBackupEmail(false, `Error running pg_dump: ${error.message}\n\nStderr: ${stderr}`);
        return reject(error);
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
  // Schedule to run at 3:00 AM every day
  cron.schedule('0 3 * * *', async () => {
    logger.info('[Cron] Triggering daily database backup');
    try {
      await runBackup();
    } catch (err) {
      logger.error('[Cron] Database backup failed', { error: err.message });
    }
  });
  logger.info('[BackupService] Daily backup cron scheduled at 3:00 AM');
}

module.exports = {
  initBackupCron,
  runBackup
};
