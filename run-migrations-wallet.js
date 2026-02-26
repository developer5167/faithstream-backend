const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const file = path.join(__dirname, 'migrations', '015_add_wallet_system.sql');
  console.log(`Running migration: 015_add_wallet_system.sql`);
  const sql = fs.readFileSync(file, 'utf8');
  try {
    await pool.query(sql);
    console.log(`Successfully ran 015_add_wallet_system.sql`);
  } catch (err) {
    console.error(`Error running 015_add_wallet_system.sql:`, err.message);
  }
  process.exit();
}

runMigrations();
