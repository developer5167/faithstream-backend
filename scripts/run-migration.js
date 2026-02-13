#!/usr/bin/env node
/**
 * Migration script to create recently_played table
 * Run: node scripts/run-migration.js
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function runMigration() {
  try {
    console.log('Running recently_played table migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/002_create_favorites_and_playlists.sql'),
      'utf8'
    );

    await db.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('Recently played table created with indexes.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
