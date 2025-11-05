#!/usr/bin/env node

/**
 * Test Runner - CLI for running test scenarios
 *
 * Usage:
 *   node src/test-runner.js single
 *   node src/test-runner.js multi
 *   node src/test-runner.js exact
 *   node src/test-runner.js all
 */

import { logger } from './utils/logger.js'
import * as scenarios from './scenarios/index.js'

/**
 * Display help message
 */
function displayHelp() {
  console.log(`
Qwen Proxy Test Client - Test Runner

Usage:
  node src/test-runner.js <command>

Commands:
  single          Run single tool tests
  multi           Run multi-tool workflow tests
  exact           Run OpenCode-exact reproduction tests
  all             Run all test scenarios
  bash            Run bash tool test only
  read            Run read tool test only
  write           Run write tool test only
  glob            Run glob tool test only

Examples:
  node src/test-runner.js single
  node src/test-runner.js all
  node src/test-runner.js bash
`)
}

/**
 * Main test runner
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === '--help' || command === '-h') {
    displayHelp()
    process.exit(0)
  }

  console.log('🤖 Qwen Proxy Test Client\n')
  console.log(`Starting test: ${command}\n`)

  try {
    let result = false

    switch (command) {
      // Test categories
      case 'single':
        result = await scenarios.runAllSingleToolTests()
        break

      case 'multi':
        result = await scenarios.runAllMultiToolTests()
        break

      case 'exact':
        result = await scenarios.runAllExactTests()
        break

      case 'all':
        result = await scenarios.runAllTests()
        break

      // Individual tool tests
      case 'bash':
        result = await scenarios.testBashTool()
        break

      case 'read':
        result = await scenarios.testReadTool()
        break

      case 'write':
        result = await scenarios.testWriteTool()
        break

      case 'glob':
        result = await scenarios.testGlobTool()
        break

      // Individual workflow tests
      case 'glob-read':
        result = await scenarios.testGlobReadWorkflow()
        break

      case 'write-read-edit':
        result = await scenarios.testWriteReadEditWorkflow()
        break

      case 'bash-grep-read':
        result = await scenarios.testBashGrepReadWorkflow()
        break

      case 'project-creation':
        result = await scenarios.testProjectCreationWorkflow()
        break

      // Individual exact tests
      case 'exact-read':
        result = await scenarios.testExactReadFileScenario()
        break

      case 'multi-turn':
        result = await scenarios.testMultiTurnConversation()
        break

      case 'empty-bash':
        result = await scenarios.testEmptyBashResultHandling()
        break

      case 'complex-params':
        result = await scenarios.testComplexParameterHandling()
        break

      default:
        logger.error(`Unknown command: ${command}`)
        displayHelp()
        process.exit(1)
    }

    // Exit with appropriate code
    if (result) {
      logger.success('\nTests completed successfully')
      process.exit(0)
    } else {
      logger.error('\nTests failed')
      process.exit(1)
    }
  } catch (error) {
    logger.error('Test runner error:', error)
    process.exit(1)
  }
}

// Run main
main()
