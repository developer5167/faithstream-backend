#!/usr/bin/env node
/**
 * Migration script to create favorite artists and albums tables
 * Run: node scripts/run-favorites-migration.js
 */

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function runMigration() {
  try {
    console.log('Running favorite artists and albums migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/004_create_favorite_artists_albums.sql'),
      'utf8'
    );

    await db.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('Favorite artists and albums tables created with indexes.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
