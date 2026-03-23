require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.error('[Error] .env file not found.');
  process.exit(1);
}

const backupDir = path.join(__dirname, '..', 'backups');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getLatestBackup() {
  if (!fs.existsSync(backupDir)) return null;
  const files = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.backup'))
    .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  
  return files.length > 0 ? files[0].name : null;
}

const argFile = process.argv[2];
const fileName = argFile || getLatestBackup();

if (!fileName) {
  console.error('[Error] No backup files found in "backups" directory and no file specified.');
  console.log('Usage: node scripts/restore-backup.js [filename.backup]');
  process.exit(1);
}

const filePath = path.join(backupDir, fileName);

if (!fs.existsSync(filePath)) {
  console.error(`[Error] Backup file not found: ${filePath}`);
  process.exit(1);
}

console.log(`\n=================================================`);
console.log(`Ready to restore database from backup:`);
console.log(`File: ${fileName}`);
console.log(`Target DB: ${process.env.DB_NAME}`);
console.log(`WARNING: This will clean (drop) existing tables and replace data with the backup.`);
console.log(`=================================================\n`);

rl.question(`Are you sure you want to proceed? (yes/no): `, (answer) => {
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('Restore aborted.');
    rl.close();
    process.exit(0);
  }

  const dbUser = process.env.DB_USER;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME;
  const dbPassword = process.env.DB_PASSWORD || '';

  // -c: clean/drop objects before recreating
  // -1: package restore into a single transaction wrapper
  // --no-owner: don't attempt to restore object ownership (useful if restoring to different user, otherwise you can omit it)
  // We include --if-exists so it doesn't fail on dropping tables that don't exist yet
  const command = `pg_restore -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} -c --if-exists -1 "${filePath}"`;

  console.log(`\nRestoring database... Please wait.`);

  exec(command, { env: { ...process.env, PGPASSWORD: dbPassword } }, (error, stdout, stderr) => {
    rl.close();
    if (error) {
      console.error('\n❌ [Error] Restore failed!');
      console.error(error.message);
      if (stderr) console.error(`\nStderr: ${stderr}`);
      process.exit(1);
    }
    console.log('\n✅ Database restored successfully!');
    if (stderr && !stderr.includes('FATAL') && !stderr.includes('ERROR')) {
       // pg_restore uses stderr for warnings and messages
       console.log(`\nNote: ${stderr}`);
    }
  });
});
