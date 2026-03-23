require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Load environment variables (Prefers .env.production if it exists)
const prodEnvPath = path.join(__dirname, '..', '.env.production');
if (fs.existsSync(prodEnvPath)) {
  require('dotenv').config({ path: prodEnvPath });
} else {
  const devEnvPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(devEnvPath)) {
    require('dotenv').config({ path: devEnvPath });
  } else {
    console.error('⚠️  No .env or .env.production file found!');
  }
}

const s3Util = require('../src/utils/s3.util');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function run() {
  console.log('☁️  Fetching available backups from S3 Production...');
  
  try {
    const backups = await s3Util.listDatabaseBackups();
    if (backups.length === 0) {
      console.log('❌ No production backups found on S3. Please ensure backups are running in production.');
      process.exit(1);
    }

    let selectedKey = null;
    const argFile = process.argv[2];

    if (argFile) {
      // If user provided a filename directly 
      selectedKey = `backups/production/${argFile}`;
    } else {
      console.log(`\nAvailable Production Backups (Latest 5):`);
      backups.slice(0, 5).forEach((b, i) => {
        const mBytes = (b.Size / 1024 / 1024).toFixed(2);
        console.log(`[${i + 1}] ${b.Key.replace('backups/production/', '')} - Size: ${mBytes} MB - Date: ${b.LastModified.toLocaleString()}`);
      });
      console.log('');
      
      const answer = await new Promise(resolve => rl.question(`Select a backup to restore (1-5) or type 'latest' [latest]: `, resolve));
      let choice = answer.trim().toLowerCase();
      if (!choice || choice === 'latest') choice = '1';
      
      const index = parseInt(choice) - 1;
      if (isNaN(index) || index < 0 || index >= backups.length) {
        console.log('❌ Invalid selection. Please select a number between 1 and 5.');
        process.exit(1);
      }
      
      selectedKey = backups[index].Key;
    }

    const fileName = selectedKey.split('/').pop();
    const tempFilePath = path.join(process.cwd(), fileName);

    console.log(`\n=================================================`);
    console.log(`⚠️  PRODUCTION RESTORE WARNING`);
    console.log(`Target DB Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Target DB Name: ${process.env.DB_NAME}`);
    console.log(`Selected Backup: ${fileName}`);
    console.log(`This will automatically DROP existing tables and replace all data!`);
    console.log(`=================================================\n`);

    const confirm = await new Promise(resolve => rl.question(`Type 'RESTORE' to proceed: `, resolve));
    if (confirm !== 'RESTORE') {
      console.log('Restore aborted. No changes made.');
      process.exit(0);
    }

    console.log(`\n⬇️  Downloading ${fileName} from S3... Please wait. This may take a moment depending on size.`);
    await s3Util.downloadDatabaseBackup(selectedKey, tempFilePath);
    console.log(`✅ Download complete! File saved temporarily to ${tempFilePath}`);

    const dbUser = process.env.DB_USER;
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME;
    const dbPassword = process.env.DB_PASSWORD || '';

    const command = `pg_restore -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} -c --if-exists -1 "${tempFilePath}"`;

    console.log(`\n🚀 Restoring database from downloaded file... Please wait.`);

    exec(command, { env: { ...process.env, PGPASSWORD: dbPassword } }, (error, stdout, stderr) => {
      rl.close();
      
      // Cleanup temp file regardless of success or failure
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log(`🧹 Cleaned up temporary downloaded file.`);
      }

      if (error) {
        console.error('\n❌ [Error] Restore failed!');
        console.error(error.message);
        if (stderr) console.error(`\nStderr: ${stderr}`);
        console.log('\n(No data was harmed because it was safely rolled back within a single transaction.)');
        process.exit(1);
      }

      console.log('\n🎉 Production Database restored successfully from AWS S3!');
      if (stderr && !stderr.includes('FATAL') && !stderr.includes('ERROR')) {
         console.log(`\nNote: ${stderr}`);
      }
    });

  } catch (err) {
    rl.close();
    console.error('❌ Error fetching from S3 or parsing file:', err.message);
    process.exit(1);
  }
}

run();
