#!/usr/bin/env node

/**
 * OpenCode Test Client - CLI Entry Point
 *
 * Interactive CLI for testing the Qwen proxy with OpenCode-identical requests
 */

import { createInterface } from 'readline'
import { validateConfig, config, getBaseURL } from './config.js'
import { logger } from './utils/logger.js'
import { TestClient } from './client.js'

// ASCII Art Banner
const BANNER = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          OpenCode Test Client v1.0.0                     ║
║                                                           ║
║  Testing Qwen Proxy with OpenCode-identical requests     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`

/**
 * Display banner and configuration
 */
function displayBanner() {
  console.log(BANNER)
  logger.info('Configuration:')
  logger.info(`  Mode: ${config.test.mode}`)
  logger.info(`  Base URL: ${getBaseURL()}`)
  logger.info(`  Model: ${config.model.name}`)
  logger.info(`  Working Dir: ${config.test.workingDir}`)
  logger.info(`  Log Level: ${config.logging.level}`)
  console.log()
}

/**
 * Display help message
 */
function displayHelp() {
  console.log(`
Available commands:

  /help              Show this help message
  /quit, /exit       Exit the client
  /clear             Clear the conversation history
  /status            Show current status and configuration
  /scenario <name>   Run a predefined test scenario
  /debug             Toggle debug logging

  Any other text    Send message to the model

Predefined scenarios:
  bash               Simple bash command execution
  read               Read a file
  multi-turn         Multi-turn conversation with multiple tool calls
  all-tools          Test all 11 tools
  errors             Test error handling

Example:
  > List the files in the current directory
  > /scenario bash
  > /quit
`)
}

/**
 * Display status
 */
function displayStatus(client) {
  const summary = client ? client.getSummary() : null
  console.log(`
Status:
  Mode:           ${config.test.mode}
  Endpoint:       ${getBaseURL()}
  Log Level:      ${config.logging.level}
  Working Dir:    ${config.test.workingDir}
  Messages:       ${summary ? summary.total : 0}
  ${summary ? `User:           ${summary.user}` : ''}
  ${summary ? `Assistant:      ${summary.assistant}` : ''}
  ${summary ? `Tool:           ${summary.tool}` : ''}
`)
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    scenario: null,
    interactive: true,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scenario' && args[i + 1]) {
      options.scenario = args[i + 1]
      options.interactive = false
      i++
    } else if (args[i] === '--help' || args[i] === '-h') {
      displayHelp()
      process.exit(0)
    }
  }

  return options
}

/**
 * Handle user input
 */
async function handleInput(input, rl, client) {
  const trimmed = input.trim()

  if (!trimmed) {
    return
  }

  // Handle commands
  if (trimmed.startsWith('/')) {
    const [command, ...args] = trimmed.slice(1).split(' ')

    switch (command.toLowerCase()) {
      case 'help':
        displayHelp()
        break

      case 'quit':
      case 'exit':
        logger.info('Goodbye!')
        rl.close()
        process.exit(0)
        break

      case 'clear':
        console.clear()
        if (client) client.clear()
        logger.info('Conversation cleared')
        break

      case 'status':
        displayStatus(client)
        break

      case 'scenario':
        if (args[0]) {
          logger.info(`Running scenario: ${args[0]}`)
          logger.warn('Scenarios not yet implemented - Phase 7')
        } else {
          logger.error('Usage: /scenario <name>')
        }
        break

      case 'debug':
        if (config.logging.level === 'debug') {
          config.logging.level = 'info'
          logger.info('Debug logging disabled')
        } else {
          config.logging.level = 'debug'
          logger.info('Debug logging enabled')
        }
        break

      default:
        logger.error(`Unknown command: /${command}. Type /help for available commands.`)
    }
  } else {
    // Send message to model
    try {
      const response = await client.sendMessage(trimmed)

      console.log(`\nAssistant: ${response.text}\n`)

      if (response.toolCalls) {
        logger.info(`Executed ${response.toolCalls.length} tool(s)`)
      }
    } catch (error) {
      logger.error('Failed to send message', error)
    }
  }
}

/**
 * Start interactive CLI
 */
async function startInteractive() {
  // Create client instance
  const client = new TestClient()

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  })

  rl.prompt()

  rl.on('line', async (input) => {
    await handleInput(input, rl, client)
    rl.prompt()
  })

  rl.on('close', () => {
    logger.info('Goodbye!')
    process.exit(0)
  })

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    logger.info('\nReceived SIGINT, exiting...')
    rl.close()
    process.exit(0)
  })
}

/**
 * Run a predefined scenario
 */
async function runScenario(name) {
  logger.info(`Running scenario: ${name}`)
  logger.warn('Scenarios not yet implemented - Phase 7')
  logger.info('Available scenarios will include:')
  logger.info('  - bash: Simple bash command')
  logger.info('  - read: Read a file')
  logger.info('  - multi-turn: Multi-turn conversation')
  logger.info('  - all-tools: Test all 11 tools')
  logger.info('  - errors: Test error handling')
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Validate configuration
    validateConfig()

    // Display banner
    displayBanner()

    // Parse command line arguments
    const options = parseArgs()

    if (options.interactive) {
      // Start interactive mode
      logger.info('Starting interactive mode. Type /help for commands.')
      console.log()
      await startInteractive()
    } else if (options.scenario) {
      // Run scenario mode
      await runScenario(options.scenario)
    }
  } catch (error) {
    logger.error('Fatal error:', error)
    process.exit(1)
  }
}

// Run main
main()
