#!/usr/bin/env node
/**
 * Migration script to create song_suggestions table
 * Run: node scripts/apply-song-suggestions.js
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function runMigration() {
  try {
    console.log('Running song_suggestions table migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/024_create_song_suggestions.sql'),
      'utf8'
    );

    await db.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('song_suggestions table created with indexes.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
