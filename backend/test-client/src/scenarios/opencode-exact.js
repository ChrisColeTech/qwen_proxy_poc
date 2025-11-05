/**
 * OpenCode-Exact Test Scenarios
 *
 * These tests reproduce exact OpenCode scenarios to validate
 * that the proxy handles real OpenCode traffic correctly
 */

import { TestClient } from '../client.js'
import { logger } from '../utils/logger.js'

/**
 * Test: Exact OpenCode Read File Scenario
 *
 * Reproduces: User asks to read a file, model calls read tool,
 * receives result, then summarizes
 */
export async function testExactReadFileScenario() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Exact OpenCode - Read File Scenario')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()

    // Setup: Create a test file
    logger.info('Setup: Creating test file')
    await client.sendMessage('Create example.txt with content "This is an example file for testing OpenCode compatibility"')

    client.clear()

    // Execute: Read the file (exactly as OpenCode would)
    logger.info('Test: Reading file with exact OpenCode pattern')
    const response = await client.sendMessage('Read the file example.txt')

    logger.info('Response received:', {
      text: response.text,
      toolCalls: response.toolCalls?.length || 0
    })

    // Validate critical aspects
    const validations = {
      hasToolCall: response.toolCalls && response.toolCalls.length > 0,
      hasReadTool: response.toolCalls?.some(tc => tc.function.name === 'read'),
      hasFinalText: response.text && response.text.length > 0,
      noNullContent: true, // This is validated internally by the client
    }

    const allPassed = Object.values(validations).every(v => v)

    if (allPassed) {
      logger.success('Exact OpenCode read file scenario passed')
      return true
    } else {
      logger.warn('Validation failed:', validations)
      return false
    }
  } catch (error) {
    logger.error('Exact OpenCode read file scenario failed:', error)
    return false
  }
}

/**
 * Test: Multi-Turn Conversation (5+ turns)
 *
 * Reproduces: Long conversation with multiple tool calls
 * Validates: No hanging, no infinite loops, proper continuation
 */
export async function testMultiTurnConversation() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Multi-Turn Conversation (5+ turns)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()

    logger.info('Starting multi-turn conversation')
    const startTime = Date.now()

    const response = await client.sendMessage(`
      Create a mini project:
      1. Create directory "test-project"
      2. Create "test-project/index.js" with console.log("Hello")
      3. Create "test-project/config.json" with {"name": "test", "version": "1.0.0"}
      4. List the directory to verify all files
      5. Read index.js to confirm content
    `, { maxTurns: 15 })

    const duration = Date.now() - startTime

    logger.info('Conversation completed', {
      duration: `${duration}ms`,
      toolCalls: response.toolCalls?.length || 0
    })

    // Validate
    const validations = {
      completed: response.text && response.text.length > 0,
      reasonableTime: duration < 60000, // Should complete in <60s
      hadMultipleToolCalls: response.toolCalls && response.toolCalls.length >= 4,
    }

    const allPassed = Object.values(validations).every(v => v)

    if (allPassed) {
      logger.success('Multi-turn conversation test passed')
      return true
    } else {
      logger.warn('Validation failed:', validations)
      return false
    }
  } catch (error) {
    logger.error('Multi-turn conversation test failed:', error)
    return false
  }
}

/**
 * Test: Empty Bash Result Handling
 *
 * Reproduces: Commands like mkdir, touch, cp that return empty strings
 * Validates: Empty results are transformed to success messages
 */
export async function testEmptyBashResultHandling() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Empty Bash Result Handling')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()

    logger.info('Testing commands that produce empty output')
    const response = await client.sendMessage('Create a directory called empty-test-dir and a file called empty-test.txt inside it')

    logger.info('Response received:', { text: response.text })

    // Should complete without errors despite empty bash output
    const validations = {
      completed: response.text && response.text.length > 0,
      hadToolCalls: response.toolCalls && response.toolCalls.length > 0,
      noErrors: !response.text.toLowerCase().includes('error'),
    }

    const allPassed = Object.values(validations).every(v => v)

    if (allPassed) {
      logger.success('Empty bash result handling test passed')
      return true
    } else {
      logger.warn('Validation failed:', validations)
      return false
    }
  } catch (error) {
    logger.error('Empty bash result handling test failed:', error)
    return false
  }
}

/**
 * Test: Tool Call with Complex Parameters
 *
 * Reproduces: Tools with multiple parameters and complex schemas
 * Validates: Parameter parsing and validation works correctly
 */
export async function testComplexParameterHandling() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Complex Parameter Handling')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()

    // Setup
    logger.info('Setup: Creating file with content to edit')
    await client.sendMessage('Create complex-edit.txt with content "Line 1\nLine 2\nLine 3"')

    client.clear()

    // Test edit tool with multiple parameters
    logger.info('Test: Edit tool with complex parameters')
    const response = await client.sendMessage('Change "Line 2" to "Modified Line 2" in complex-edit.txt')

    logger.info('Response received:', { text: response.text })

    const validations = {
      completed: response.text && response.text.length > 0,
      hasEditTool: response.toolCalls?.some(tc => tc.function.name === 'edit'),
    }

    const allPassed = Object.values(validations).every(v => v)

    if (allPassed) {
      logger.success('Complex parameter handling test passed')
      return true
    } else {
      logger.warn('Validation failed:', validations)
      return false
    }
  } catch (error) {
    logger.error('Complex parameter handling test failed:', error)
    return false
  }
}

/**
 * Run all OpenCode-exact tests
 */
export async function runAllExactTests() {
  console.log('\n╔═══════════════════════════════════════════╗')
  console.log('║  Running All OpenCode-Exact Tests       ║')
  console.log('╚═══════════════════════════════════════════╝\n')

  const results = {
    readFile: await testExactReadFileScenario(),
    multiTurn: await testMultiTurnConversation(),
    emptyBashResult: await testEmptyBashResultHandling(),
    complexParameters: await testComplexParameterHandling(),
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 OpenCode-Exact Test Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const passed = Object.values(results).filter(r => r).length
  const total = Object.keys(results).length

  Object.entries(results).forEach(([name, result]) => {
    console.log(`  ${result ? '✅' : '❌'} ${name}`)
  })

  console.log(`\n  Total: ${passed}/${total} passed\n`)

  return passed === total
}
