/**
 * Migrate Command
 * Runs the environment-to-database migration wizard
 */

import { initDatabase } from '../../database/connection.js'
import {
  isMigrationNeeded,
  migrateEnvToDatabase,
  validateMigration
} from '../../database/migrations/migrate-env-to-db.js'
import { ProviderService } from '../../database/services/provider-service.js'
import { confirm } from '../utils/prompt.js'
import { success, error as errorColor, bold, info, warning } from '../utils/colors.js'
import { formatBox } from '../utils/table-formatter.js'

export async function migrateCommand(options) {
  try {
    // Initialize database
    initDatabase()

    // Display header
    console.log('\n' + formatBox('Provider Configuration Migration', {
      title: 'Environment to Database Migration'
    }))
    console.log()

    console.log(info('This wizard will migrate your provider configurations from .env to the database.'))
    console.log()

    // Check if migration is needed
    console.log(info('Analyzing current configuration...'))
    console.log()

    if (!isMigrationNeeded()) {
      console.log(success('Providers already exist in database!'))
      console.log()
      console.log('Current providers:')

      const providers = ProviderService.getAll()
      providers.forEach(provider => {
        const status = provider.enabled ? success('Enabled') : warning('Disabled')
        console.log(`  - ${bold(provider.name)} (${provider.id}) - ${status}`)
      })

      console.log()
      console.log(info('Migration is not needed. Use CLI commands to manage providers.'))
      console.log()
      return
    }

    console.log(warning('No providers found in database - migration needed'))
    console.log()

    // Dry run mode
    if (options.dryRun) {
      console.log(info('Running in dry-run mode - no changes will be made'))
      console.log()

      const result = await migrateEnvToDatabase({ dryRun: true })

      if (result.success && result.config) {
        console.log(bold('Configuration to be migrated:'))
        console.log()
        console.log(`Default Provider: ${result.config.defaultProvider}`)
        console.log()
        console.log('LM Studio:')
        console.log(`  Base URL:      ${result.config.lmStudio.baseURL}`)
        console.log(`  Default Model: ${result.config.lmStudio.defaultModel}`)
        console.log(`  Timeout:       ${result.config.lmStudio.timeout}ms`)
        console.log()
        console.log('Qwen Proxy:')
        console.log(`  Base URL: ${result.config.qwenProxy.baseURL}`)
        console.log(`  Timeout:  ${result.config.qwenProxy.timeout}ms`)
        console.log()
        console.log('Qwen Direct:')
        console.log(`  Base URL: ${result.config.qwenDirect.baseURL}`)
        console.log(`  API Key:  ${result.config.qwenDirect.apiKey ? '***CONFIGURED***' : 'Not configured'}`)
        console.log(`  Timeout:  ${result.config.qwenDirect.timeout}ms`)
        console.log()
        console.log(success('Dry run completed - no changes made'))
        console.log()
        console.log(info('Run without --dry-run to perform the migration'))
        console.log()
      } else {
        console.log(errorColor('Dry run failed: ' + result.message))
        console.log()
        process.exit(1)
      }

      return
    }

    // Confirm migration
    console.log(warning('This will:'))
    console.log('  1. Create a backup of the current database')
    console.log('  2. Read provider configurations from .env file')
    console.log('  3. Create provider records in the database')
    console.log('  4. Create default models and link them to providers')
    console.log('  5. Set the active provider from DEFAULT_PROVIDER env var')
    console.log()

    const confirmed = await confirm('Proceed with migration?', true)

    if (!confirmed) {
      console.log(info('\nMigration cancelled'))
      console.log()
      return
    }

    // Run migration
    console.log()
    console.log(info('Starting migration...'))
    console.log()

    const result = await migrateEnvToDatabase({
      createBackup: true,
      dryRun: false
    })

    console.log()

    if (result.success) {
      if (result.skipped) {
        console.log(warning(result.message))
      } else {
        console.log(success(bold('Migration completed successfully!')))
        console.log()

        if (result.backupPath) {
          console.log(`Backup created: ${result.backupPath}`)
        }

        console.log(`Providers created: ${result.providersCreated}`)

        if (result.activeProvider) {
          console.log(`Active provider: ${result.activeProvider}`)
        }

        console.log()

        // Validate migration
        console.log(info('Validating migration...'))

        if (validateMigration()) {
          console.log(success('Validation passed!'))
          console.log()

          // Show created providers
          console.log(bold('Created providers:'))
          const providers = ProviderService.getAll()
          providers.forEach(provider => {
            const status = provider.enabled ? success('Enabled') : warning('Disabled')
            console.log(`  - ${bold(provider.name)} (${provider.id}) - ${provider.type} - ${status}`)
          })

          console.log()
          console.log(formatBox('Next Steps', {
            title: 'Migration Complete'
          }))
          console.log()
          console.log('1. Test providers:')
          console.log(`   ${info('provider-cli provider list')}`)
          console.log()
          console.log('2. Test connection:')
          console.log(`   ${info('provider-cli provider test <provider-id>')}`)
          console.log()
          console.log('3. Manage providers:')
          console.log(`   ${info('provider-cli provider --help')}`)
          console.log()
          console.log('4. Optional: Remove provider configs from .env file')
          console.log('   (Keep PORT, HOST, LOG_LEVEL, etc.)')
          console.log()

        } else {
          console.log(errorColor('Validation failed!'))
          console.log()
          console.log(warning('Migration may be incomplete. Check logs for details.'))
          console.log()
          if (result.backupPath) {
            console.log(`You can restore from backup: ${result.backupPath}`)
            console.log()
          }
          process.exit(1)
        }
      }
    } else {
      console.log(errorColor(bold('Migration failed!')))
      console.log()
      console.log('Error: ' + result.message)
      console.log()
      if (result.backupPath) {
        console.log(`Backup available at: ${result.backupPath}`)
        console.log()
      }
      process.exit(1)
    }

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    console.error(errorColor('Stack: ' + err.stack))
    process.exit(1)
  }
}
