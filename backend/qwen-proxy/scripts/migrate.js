#!/usr/bin/env node
/**
 * Migration CLI Tool
 *
 * Command-line interface for running database migrations
 *
 * Usage:
 *   node scripts/migrate.js up      # Run pending migrations
 *   node scripts/migrate.js down    # Rollback last migration
 *   node scripts/migrate.js status  # Show migration status
 *
 * Examples:
 *   # Check current migration status
 *   node scripts/migrate.js status
 *
 *   # Run all pending migrations
 *   node scripts/migrate.js up
 *
 *   # Rollback the last migration (development only!)
 *   node scripts/migrate.js down
 */

const path = require('path');

// Resolve database module path
const databasePath = path.join(__dirname, '../src/database');
const { initializeDatabase, MigrationRunner } = require(databasePath);

/**
 * Display migration status
 */
async function showStatus(runner) {
  const current = runner.getCurrentVersion();
  const migrations = runner.loadMigrations();

  console.log('\n=================================');
  console.log('Database Migration Status');
  console.log('=================================\n');
  console.log(`Current schema version: ${current}\n`);

  if (migrations.length === 0) {
    console.log('No migration files found.');
    console.log('Expected location: src/database/migrations/\n');
    return;
  }

  console.log('Available migrations:\n');

  migrations.forEach(m => {
    const status = m.version <= current ? '✓ Applied' : '○ Pending';
    const marker = m.version === current ? ' (current)' : '';
    console.log(`  ${status} v${m.version}: ${m.name}${marker}`);
  });

  const pending = migrations.filter(m => m.version > current);

  console.log('\n---------------------------------');
  console.log(`Applied: ${migrations.length - pending.length}`);
  console.log(`Pending: ${pending.length}`);
  console.log('=================================\n');
}

/**
 * Run pending migrations
 */
async function runMigrations(runner) {
  console.log('\n=================================');
  console.log('Running Migrations');
  console.log('=================================\n');

  try {
    await runner.runMigrations();
    console.log('\n=================================');
    console.log('Migrations completed successfully');
    console.log('=================================\n');
  } catch (error) {
    console.error('\n=================================');
    console.error('Migration failed!');
    console.error('=================================\n');
    throw error;
  }
}

/**
 * Rollback last migration
 */
async function rollbackMigration(runner) {
  console.log('\n=================================');
  console.log('Rolling Back Last Migration');
  console.log('=================================\n');
  console.warn('⚠️  WARNING: This should only be used in development!\n');

  try {
    await runner.rollbackLastMigration();
    console.log('\n=================================');
    console.log('Rollback completed successfully');
    console.log('=================================\n');
  } catch (error) {
    console.error('\n=================================');
    console.error('Rollback failed!');
    console.error('=================================\n');
    throw error;
  }
}

/**
 * Display usage information
 */
function showUsage() {
  console.log('\nUsage: node scripts/migrate.js [command]\n');
  console.log('Commands:');
  console.log('  up      Run pending migrations');
  console.log('  down    Rollback last migration (dev only)');
  console.log('  status  Show migration status (default)\n');
  console.log('Examples:');
  console.log('  node scripts/migrate.js status');
  console.log('  node scripts/migrate.js up');
  console.log('  node scripts/migrate.js down\n');
}

/**
 * Main entry point
 */
async function main() {
  const command = process.argv[2] || 'status';

  try {
    // Initialize database connection
    console.log('[Database] Connecting to database...');
    await initializeDatabase();

    // Create migration runner
    const runner = new MigrationRunner();

    // Execute command
    switch (command.toLowerCase()) {
      case 'up':
        await runMigrations(runner);
        await showStatus(runner);
        break;

      case 'down':
        await rollbackMigration(runner);
        await showStatus(runner);
        break;

      case 'status':
        await showStatus(runner);
        break;

      case 'help':
      case '--help':
      case '-h':
        showUsage();
        break;

      default:
        console.error(`\nError: Unknown command '${command}'\n`);
        showUsage();
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\nFatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\nUnhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\nUncaught exception:', error);
  process.exit(1);
});

// Run main function
main();
