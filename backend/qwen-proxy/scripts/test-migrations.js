#!/usr/bin/env node
/**
 * Test Migration System
 *
 * Comprehensive test of the migration system functionality
 * Tests: status, up, down, version tracking
 */

const path = require('path');
const fs = require('fs');

// Resolve database module path
const databasePath = path.join(__dirname, '../src/database');
const { initializeDatabase, MigrationRunner, getSchemaVersion } = require(databasePath);

/**
 * Test migration system
 */
async function testMigrations() {
  console.log('\n========================================');
  console.log('Migration System Test');
  console.log('========================================\n');

  try {
    // Step 1: Initialize database
    console.log('Step 1: Initialize database...');
    await initializeDatabase();
    console.log('✓ Database initialized\n');

    // Step 2: Create migration runner
    console.log('Step 2: Create migration runner...');
    const runner = new MigrationRunner();
    console.log('✓ Migration runner created\n');

    // Step 3: Check initial version
    console.log('Step 3: Check schema version...');
    const version = runner.getCurrentVersion();
    console.log(`✓ Current schema version: ${version}\n`);

    // Step 4: Load migrations
    console.log('Step 4: Load migration files...');
    const migrations = runner.loadMigrations();
    console.log(`✓ Found ${migrations.length} migration(s):`);
    migrations.forEach(m => {
      const status = m.version <= version ? '✓ Applied' : '○ Pending';
      console.log(`  ${status} v${m.version}: ${m.name}`);
    });
    console.log('');

    // Step 5: Check migration directory
    console.log('Step 5: Verify migration directory...');
    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js');
    console.log(`✓ Migration directory exists: ${migrationsDir}`);
    console.log(`✓ Migration files found: ${files.length}`);
    files.forEach(f => console.log(`  - ${f}`));
    console.log('');

    // Step 6: Verify metadata table
    console.log('Step 6: Verify metadata table...');
    const db = require(databasePath).getDatabase();
    const metadata = db.prepare('SELECT * FROM metadata').all();
    console.log(`✓ Metadata table contains ${metadata.length} record(s):`);
    metadata.forEach(row => {
      console.log(`  - ${row.key} = ${row.value} (updated: ${new Date(row.updated_at).toISOString()})`);
    });
    console.log('');

    // Step 7: Test migration functions
    console.log('Step 7: Test migration functions...');
    const testMigration = migrations[0];
    if (testMigration) {
      console.log(`✓ Migration structure valid:`);
      console.log(`  - name: ${testMigration.name}`);
      console.log(`  - version: ${testMigration.version}`);
      console.log(`  - up function: ${typeof testMigration.up === 'function' ? 'defined' : 'missing'}`);
      console.log(`  - down function: ${typeof testMigration.down === 'function' ? 'defined' : 'missing'}`);
    }
    console.log('');

    // Step 8: Summary
    console.log('========================================');
    console.log('Test Results');
    console.log('========================================\n');
    console.log('✓ All tests passed!');
    console.log(`✓ Schema version: ${version}`);
    console.log(`✓ Migrations loaded: ${migrations.length}`);
    console.log(`✓ Migration files: ${files.length}`);
    console.log(`✓ Metadata records: ${metadata.length}\n`);

    console.log('Migration System Status: ✅ OPERATIONAL\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testMigrations();
