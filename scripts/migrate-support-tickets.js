#!/usr/bin/env node
/**
 * Migration script to create support_tickets table
 * Run: node scripts/migrate-support-tickets.js
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function runMigration() {
  try {
    console.log('Running support_tickets table migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/002_create_support_tickets.sql'),
      'utf8'
    );

    await db.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('Support tickets table created with indexes.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
