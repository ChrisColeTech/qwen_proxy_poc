#!/usr/bin/env node
/**
 * Provider CLI
 * Command-line interface for managing provider settings
 */

import { Command } from 'commander'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { statusCommand } from './commands/status.js'
import { setCommand } from './commands/set.js'
import { listCommand } from './commands/list.js'
import { testCommand } from './commands/test.js'
import { historyCommand } from './commands/history.js'
import { statsCommand } from './commands/stats.js'
import { migrateCommand } from './commands/migrate.js'

// Provider commands
import { providerListCommand } from './commands/provider/list.js'
import { providerAddCommand } from './commands/provider/add.js'
import { providerEditCommand } from './commands/provider/edit.js'
import { providerRemoveCommand } from './commands/provider/remove.js'
import { providerEnableCommand } from './commands/provider/enable.js'
import { providerDisableCommand } from './commands/provider/disable.js'
import { providerTestCommand } from './commands/provider/test-connection.js'

// Model commands
import { modelListCommand } from './commands/model/list.js'
import { modelAddCommand } from './commands/model/add.js'
import { modelLinkCommand } from './commands/model/link.js'
import { modelUnlinkCommand } from './commands/model/unlink.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf8')
)

const program = new Command()

program
  .name('provider-cli')
  .description('CLI tool for managing LLM provider settings')
  .version(packageJson.version)

// Active provider management commands (existing)

program
  .command('status')
  .description('Show current active provider and its configuration')
  .action(statusCommand)

program
  .command('set <provider>')
  .description('Set the active provider (for request routing)')
  .action(setCommand)

program
  .command('list')
  .alias('ls')
  .description('List available providers (for switching active provider)')
  .action(listCommand)

program
  .command('test [provider]')
  .description('Test provider connectivity (defaults to current provider)')
  .action(testCommand)

program
  .command('history')
  .description('Show recent request history')
  .option('-l, --limit <number>', 'Limit number of results (default: 50)', '50')
  .option('-p, --provider <name>', 'Filter by provider name')
  .action(historyCommand)

program
  .command('stats')
  .description('Show usage statistics and analytics')
  .action(statsCommand)

// Provider management commands (new)

const provider = program
  .command('provider')
  .description('Manage provider configurations')

provider
  .command('list')
  .description('List all providers with details')
  .option('-t, --type <type>', 'Filter by provider type (lm-studio, qwen-proxy, qwen-direct)')
  .option('-e, --enabled', 'Show only enabled providers')
  .action(providerListCommand)

provider
  .command('add')
  .description('Add a new provider interactively')
  .action(providerAddCommand)

provider
  .command('edit <id>')
  .description('Edit provider configuration')
  .action(providerEditCommand)

provider
  .command('remove <id>')
  .description('Remove a provider')
  .action(providerRemoveCommand)

provider
  .command('enable <id>')
  .description('Enable a provider')
  .action(providerEnableCommand)

provider
  .command('disable <id>')
  .description('Disable a provider')
  .action(providerDisableCommand)

provider
  .command('test <id>')
  .description('Test provider connection and health')
  .action(providerTestCommand)

// Model management commands (new)

const model = program
  .command('model')
  .description('Manage model configurations')

model
  .command('list')
  .description('List all models')
  .option('-c, --capability <capability>', 'Filter by capability (chat, streaming, tools, etc.)')
  .action(modelListCommand)

model
  .command('add')
  .description('Add a new model interactively')
  .action(modelAddCommand)

model
  .command('link <provider-id> <model-id>')
  .description('Link a model to a provider')
  .action(modelLinkCommand)

model
  .command('unlink <provider-id> <model-id>')
  .description('Unlink a model from a provider')
  .action(modelUnlinkCommand)

// Migration command (new)

program
  .command('migrate')
  .description('Run environment-to-database migration wizard')
  .option('-d, --dry-run', 'Run in dry-run mode (no changes)')
  .action(migrateCommand)

program.parse()
