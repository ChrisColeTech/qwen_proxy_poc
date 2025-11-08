/**
 * Database Migrations
 * Handles database schema versioning and migrations
 */

import { getDatabase } from './connection.js'
import { logger } from '../utils/logger.js'

const migrations = [
  // Migration 1: Initial schema (already in schema.sql)
  {
    version: 1,
    description: 'Initial schema with settings and request_logs',
    up: () => {
      // Schema is created by connection.js
      logger.info('Migration 1: Initial schema (already applied)')
    },
    down: () => {
      const db = getDatabase()
      db.exec('DROP TABLE IF EXISTS request_logs')
      db.exec('DROP TABLE IF EXISTS settings')
    }
  },

  // Migration 2: Split request_logs into sessions, requests, and responses
  {
    version: 2,
    description: 'Split request_logs into separate sessions, requests, and responses tables',
    up: () => {
      const db = getDatabase()

      logger.info('Migration 2: Creating new tables (sessions, requests, responses, metadata)')

      // Create metadata table
      db.exec(`
        CREATE TABLE IF NOT EXISTS metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `)

      // Create sessions table
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          parent_id TEXT,
          first_user_message TEXT NOT NULL,
          message_count INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          last_accessed INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        )
      `)

      db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_chat_id ON sessions(chat_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at)')

      // Create requests table
      db.exec(`
        CREATE TABLE IF NOT EXISTS requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          request_id TEXT NOT NULL UNIQUE,
          timestamp INTEGER NOT NULL,
          method TEXT NOT NULL,
          path TEXT NOT NULL,
          openai_request TEXT NOT NULL,
          qwen_request TEXT NOT NULL,
          model TEXT NOT NULL,
          stream BOOLEAN NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `)

      db.exec('CREATE INDEX IF NOT EXISTS idx_requests_session_id ON requests(session_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_requests_request_id ON requests(request_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at)')

      // Create responses table
      db.exec(`
        CREATE TABLE IF NOT EXISTS responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          request_id INTEGER NOT NULL,
          session_id TEXT NOT NULL,
          response_id TEXT NOT NULL UNIQUE,
          timestamp INTEGER NOT NULL,
          qwen_response TEXT,
          openai_response TEXT,
          parent_id TEXT,
          completion_tokens INTEGER,
          prompt_tokens INTEGER,
          total_tokens INTEGER,
          finish_reason TEXT,
          error TEXT,
          duration_ms INTEGER,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
      `)

      db.exec('CREATE INDEX IF NOT EXISTS idx_responses_request_id ON responses(request_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_responses_response_id ON responses(response_id)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_responses_timestamp ON responses(timestamp)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at)')

      logger.info('Migration 2: Migrating data from request_logs to new tables')

      // Check if request_logs table exists before trying to migrate
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='request_logs'
      `).get()

      if (!tableExists) {
        logger.info('Migration 2: request_logs table does not exist, skipping data migration')
        logger.info('Migration 2: New database detected, no data to migrate')
        return
      }

      // Migrate data from request_logs
      // For each request_log entry, create a session, request, and response
      const oldLogs = db.prepare('SELECT * FROM request_logs').all()

      logger.info(`Migration 2: Found ${oldLogs.length} records to migrate`)

      const insertSession = db.prepare(`
        INSERT OR IGNORE INTO sessions (id, chat_id, parent_id, first_user_message, message_count, created_at, last_accessed, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const insertRequest = db.prepare(`
        INSERT INTO requests (session_id, request_id, timestamp, method, path, openai_request, qwen_request, model, stream, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const insertResponse = db.prepare(`
        INSERT INTO responses (request_id, session_id, response_id, timestamp, qwen_response, openai_response, parent_id, completion_tokens, prompt_tokens, total_tokens, finish_reason, error, duration_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      let migratedCount = 0

      for (const log of oldLogs) {
        try {
          // Generate session ID from request_id (since we don't have original first message)
          const sessionId = `migrated-session-${log.id}`
          const timestampMs = log.created_at * 1000 // Convert seconds to milliseconds

          // Create a default session for this request
          insertSession.run(
            sessionId,
            'migrated-chat-id', // Default chat ID
            null, // parent_id
            `Migrated from request_logs (${log.endpoint})`, // first_user_message
            1, // message_count
            timestampMs,
            timestampMs,
            timestampMs + (30 * 60 * 1000) // expires_at: 30 minutes from creation
          )

          // Insert request
          const requestResult = insertRequest.run(
            sessionId,
            log.request_id,
            timestampMs,
            log.method,
            log.endpoint, // path
            log.request_body || '{}', // openai_request
            log.request_body || '{}', // qwen_request (same as openai for migration)
            'migrated-model', // model (unknown)
            0, // stream (default false)
            timestampMs
          )

          const requestDbId = requestResult.lastInsertRowid

          // Insert response
          const responseId = `migrated-response-${log.id}`
          insertResponse.run(
            requestDbId,
            sessionId,
            responseId,
            timestampMs,
            null, // qwen_response
            log.response_body || '{}', // openai_response
            null, // parent_id
            null, // completion_tokens
            null, // prompt_tokens
            null, // total_tokens
            log.status_code === 200 ? 'stop' : 'error', // finish_reason
            log.error, // error
            log.duration_ms,
            timestampMs
          )

          migratedCount++
        } catch (error) {
          logger.error(`Migration 2: Failed to migrate log ${log.id}:`, error)
          // Continue with next record
        }
      }

      logger.info(`Migration 2: Successfully migrated ${migratedCount} of ${oldLogs.length} records`)

      // Drop old request_logs table
      logger.info('Migration 2: Dropping old request_logs table')
      db.exec('DROP TABLE IF EXISTS request_logs')

      // Insert schema version
      db.prepare(`
        INSERT OR IGNORE INTO metadata (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run('schema_version', '2', Date.now())

      logger.info('Migration 2: Completed successfully')
    },
    down: () => {
      const db = getDatabase()

      logger.info('Migration 2 rollback: Recreating request_logs table')

      // Recreate old request_logs table
      db.exec(`
        CREATE TABLE IF NOT EXISTS request_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          request_id TEXT NOT NULL UNIQUE,
          provider TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          request_body TEXT,
          response_body TEXT,
          status_code INTEGER,
          duration_ms INTEGER,
          error TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )
      `)

      db.exec('CREATE INDEX IF NOT EXISTS idx_request_logs_provider ON request_logs(provider)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at DESC)')
      db.exec('CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON request_logs(request_id)')

      // Drop new tables
      logger.info('Migration 2 rollback: Dropping new tables')
      db.exec('DROP TABLE IF EXISTS responses')
      db.exec('DROP TABLE IF EXISTS requests')
      db.exec('DROP TABLE IF EXISTS sessions')
      db.exec('DROP TABLE IF EXISTS metadata')

      logger.info('Migration 2 rollback: Completed')
    }
  },

  // Migration 3: Provider Configuration System
  {
    version: 3,
    description: 'Add provider configuration tables for database-driven provider management',
    up: () => {
      const db = getDatabase()

      logger.info('Migration 3: Creating provider configuration tables')

      // Execute schema directly (schema-v3.sql content)
      db.exec(`
        -- Providers Table
        CREATE TABLE IF NOT EXISTS providers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            enabled BOOLEAN NOT NULL DEFAULT 1,
            priority INTEGER NOT NULL DEFAULT 0,
            description TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            UNIQUE(name)
        );

        CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);
        CREATE INDEX IF NOT EXISTS idx_providers_enabled ON providers(enabled);
        CREATE INDEX IF NOT EXISTS idx_providers_priority ON providers(priority DESC);

        -- Provider Configs Table
        CREATE TABLE IF NOT EXISTS provider_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            is_sensitive BOOLEAN DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
            UNIQUE(provider_id, key)
        );

        CREATE INDEX IF NOT EXISTS idx_provider_configs_provider_id ON provider_configs(provider_id);
        CREATE INDEX IF NOT EXISTS idx_provider_configs_key ON provider_configs(key);

        -- Models Table
        CREATE TABLE IF NOT EXISTS models (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            capabilities TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);

        -- Provider Models Table
        CREATE TABLE IF NOT EXISTS provider_models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_id TEXT NOT NULL,
            model_id TEXT NOT NULL,
            is_default BOOLEAN DEFAULT 0,
            config TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
            FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
            UNIQUE(provider_id, model_id)
        );

        CREATE INDEX IF NOT EXISTS idx_provider_models_provider_id ON provider_models(provider_id);
        CREATE INDEX IF NOT EXISTS idx_provider_models_model_id ON provider_models(model_id);
        CREATE INDEX IF NOT EXISTS idx_provider_models_is_default ON provider_models(is_default);
      `)

      logger.info('Migration 3: Provider configuration tables created')

      // Update schema version in metadata
      db.prepare(`
        INSERT OR REPLACE INTO metadata (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run('schema_version', '3', Date.now())

      logger.info('Migration 3: Completed successfully')
    },
    down: () => {
      const db = getDatabase()

      logger.info('Migration 3 rollback: Dropping provider configuration tables')

      db.exec('DROP TABLE IF EXISTS provider_models')
      db.exec('DROP TABLE IF EXISTS provider_configs')
      db.exec('DROP TABLE IF EXISTS models')
      db.exec('DROP TABLE IF EXISTS providers')

      // Update schema version
      db.prepare(`
        UPDATE metadata SET value = ?, updated_at = ?
        WHERE key = ?
      `).run('2', Date.now(), 'schema_version')

      logger.info('Migration 3 rollback: Completed')
    }
  },

  // Migration 4: Data Seeding (Optional - only runs if no providers exist)
  {
    version: 4,
    description: 'Seed default provider configurations if database is empty (models discovered via sync)',
    up: async () => {
      const db = getDatabase()

      logger.info('Migration 4: Checking if data seeding is needed')

      // Dynamic import to avoid circular dependencies
      const { default: seeder } = await import('./seeders/default-providers.js')

      // Check if providers exist
      if (!seeder.hasProviders()) {
        logger.info('Migration 4: No providers found, seeding default data')

        // Parse environment variables for configuration
        const config = {
          lmStudio: {
            baseURL: process.env.LM_STUDIO_BASE_URL || 'http://192.168.0.22:1234/v1',
            defaultModel: process.env.LM_STUDIO_DEFAULT_MODEL || 'qwen3-max',
            timeout: parseInt(process.env.REQUEST_TIMEOUT) || 120000
          },
          qwenProxy: {
            baseURL: process.env.QWEN_PROXY_BASE_URL || 'http://localhost:3000',
            timeout: parseInt(process.env.REQUEST_TIMEOUT) || 120000
          },
          qwenDirect: {
            baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            apiKey: process.env.QWEN_API_KEY || null,
            timeout: parseInt(process.env.REQUEST_TIMEOUT) || 120000
          }
        }

        // Seed default providers
        await seeder.seedAllProviders(config)

        // Set default provider in settings
        const defaultProvider = process.env.DEFAULT_PROVIDER || 'lm-studio'
        const providerMap = {
          'lm-studio': 'lm-studio-default',
          'qwen-proxy': 'qwen-proxy-default',
          'qwen-direct': 'qwen-direct-default'
        }

        const providerId = providerMap[defaultProvider] || 'lm-studio-default'

        // Import SettingsService dynamically to avoid circular dependency
        const { SettingsService } = await import('./services/settings-service.js')
        SettingsService.set('active_provider', providerId)

        logger.info(`Migration 4: Default provider set to ${providerId}`)
        logger.info('Migration 4: Data seeding completed successfully')
      } else {
        logger.info('Migration 4: Providers already exist, skipping data seeding')
      }

      // Update schema version in metadata
      db.prepare(`
        INSERT OR REPLACE INTO metadata (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run('schema_version', '4', Date.now())

      logger.info('Migration 4: Completed successfully')
    },
    down: () => {
      const db = getDatabase()

      logger.info('Migration 4 rollback: Removing seeded data')

      // Note: We don't actually delete data in rollback as it might be user-modified
      // This is just to update the schema version
      logger.warn('Migration 4 rollback: Data seeding rollback does not delete data')
      logger.warn('If you want to remove seeded data, manually delete from providers, models tables')

      // Update schema version
      db.prepare(`
        UPDATE metadata SET value = ?, updated_at = ?
        WHERE key = ?
      `).run('3', Date.now(), 'schema_version')

      logger.info('Migration 4 rollback: Completed')
    }
  },

  // Migration 5: Server Settings Infrastructure
  {
    version: 5,
    description: 'Add indexes for settings and seed default server settings',
    up: async () => {
      const db = getDatabase()

      logger.info('Migration 5: Adding settings indexes and seeding defaults')

      // Create index on settings table for faster lookups
      db.exec('CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)')

      // Import and run the settings seeder
      const { seedDefaultSettings } = await import('./seeders/default-settings.js')
      const result = await seedDefaultSettings()

      logger.info('Migration 5: Settings seeding complete', result)

      // Update schema version
      db.prepare(`
        INSERT OR REPLACE INTO metadata (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run('schema_version', '5', Date.now())

      logger.info('Migration 5: Completed successfully')
    },
    down: () => {
      const db = getDatabase()

      logger.info('Migration 5 rollback: Removing settings index')

      // Drop index
      db.exec('DROP INDEX IF EXISTS idx_settings_key')

      // Update schema version
      db.prepare(`
        UPDATE metadata SET value = ?, updated_at = ?
        WHERE key = ?
      `).run('4', Date.now(), 'schema_version')

      logger.info('Migration 5 rollback: Completed')
    }
  }
]

/**
 * Get current schema version
 */
export function getCurrentVersion() {
  const db = getDatabase()

  // Create version table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `)

  const row = db.prepare('SELECT MAX(version) as version FROM schema_version').get()
  return row.version || 0
}

/**
 * Run pending migrations
 */
export async function runMigrations() {
  const currentVersion = getCurrentVersion()
  const pendingMigrations = migrations.filter(m => m.version > currentVersion)

  if (pendingMigrations.length === 0) {
    logger.info('No pending migrations')
    return
  }

  logger.info(`Running ${pendingMigrations.length} pending migrations...`)

  const db = getDatabase()

  for (const migration of pendingMigrations) {
    try {
      logger.info(`Applying migration ${migration.version}: ${migration.description}`)

      // Support both sync and async migration functions
      const result = migration.up()
      if (result instanceof Promise) {
        await result
      }

      // Record migration
      db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(migration.version)

      logger.info(`Migration ${migration.version} completed`)
    } catch (error) {
      logger.error(`Migration ${migration.version} failed:`, error)
      throw error
    }
  }

  logger.info('All migrations completed')
}

/**
 * Rollback to a specific version
 */
export function rollbackTo(targetVersion) {
  const currentVersion = getCurrentVersion()

  if (targetVersion >= currentVersion) {
    logger.warn('Target version is same or higher than current version')
    return
  }

  const migrationsToRollback = migrations
    .filter(m => m.version > targetVersion && m.version <= currentVersion)
    .reverse() // Rollback in reverse order

  logger.info(`Rolling back ${migrationsToRollback.length} migrations...`)

  const db = getDatabase()

  for (const migration of migrationsToRollback) {
    try {
      logger.info(`Rolling back migration ${migration.version}`)
      migration.down()

      // Remove migration record
      db.prepare('DELETE FROM schema_version WHERE version = ?').run(migration.version)

      logger.info(`Migration ${migration.version} rolled back`)
    } catch (error) {
      logger.error(`Rollback of migration ${migration.version} failed:`, error)
      throw error
    }
  }

  logger.info(`Rolled back to version ${targetVersion}`)
}

export default { getCurrentVersion, runMigrations, rollbackTo }
