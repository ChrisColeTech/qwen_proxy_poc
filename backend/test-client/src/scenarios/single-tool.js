/**
 * Single Tool Test Scenarios
 *
 * Tests individual tool execution to validate proxy behavior
 */

import { TestClient } from '../client.js'
import { logger } from '../utils/logger.js'

/**
 * Test: Bash Tool - ls command
 */
export async function testBashTool() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Bash Tool - ls command')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()
    const response = await client.sendMessage('List the files in the current directory using ls')

    logger.info('Response received:', {
      text: response.text?.substring(0, 100) + '...',
      steps: response.steps?.length || 0,
      finishReason: response.finishReason
    })

    // Check if tool was executed (should have steps > 1 or text containing file names)
    const hasToolExecution = response.steps && response.steps.length > 1
    const hasFileList = response.text && (
      response.text.includes('package.json') ||
      response.text.includes('src') ||
      response.text.includes('README')
    )

    if (!hasToolExecution && !hasFileList) {
      logger.warn('Expected bash tool execution with file list, but none found')
      return false
    }

    logger.success('Bash tool test passed - tool was executed and results presented')
    return true
  } catch (error) {
    logger.error('Bash tool test failed:', error)
    return false
  }
}

/**
 * Test: Read Tool
 */
export async function testReadTool() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Read Tool')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()

    // First create a test file
    logger.info('Step 1: Creating test file')
    await client.sendMessage('Create a file called test-read.txt with content "Hello World from test"')

    // Reset client for new conversation
    client.clear()

    // Then read it
    logger.info('Step 2: Reading test file')
    const response = await client.sendMessage('Read the file test-read.txt')

    logger.info('Response received:', { text: response.text })

    if (!response.text || !response.text.includes('Hello World from test')) {
      logger.warn('Expected file content in response, but not found')
      return false
    }

    logger.success('Read tool test passed')
    return true
  } catch (error) {
    logger.error('Read tool test failed:', error)
    return false
  }
}

/**
 * Test: Write Tool
 */
export async function testWriteTool() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Write Tool')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()
    const response = await client.sendMessage('Write "Test Content for Write Tool" to file test-write.txt')

    logger.info('Response received:', {
      text: response.text?.substring(0, 100) + '...',
      steps: response.steps?.length || 0,
      finishReason: response.finishReason
    })

    // Check if tool was executed (should have steps > 1)
    const hasToolExecution = response.steps && response.steps.length > 1
    const hasSuccessMessage = response.text && (
      response.text.toLowerCase().includes('written') ||
      response.text.toLowerCase().includes('created') ||
      response.text.toLowerCase().includes('file')
    )

    if (!hasToolExecution && !hasSuccessMessage) {
      logger.warn('Expected write tool execution, but none found')
      return false
    }

    logger.success('Write tool test passed - tool was executed and results presented')
    return true
  } catch (error) {
    logger.error('Write tool test failed:', error)
    return false
  }
}

/**
 * Test: Glob Tool
 */
export async function testGlobTool() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Glob Tool')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()
    const response = await client.sendMessage('Find all .js files in the current directory')

    logger.info('Response received:', {
      text: response.text?.substring(0, 100) + '...',
      steps: response.steps?.length || 0,
      finishReason: response.finishReason
    })

    // Check if tool was executed (should have steps > 1)
    const hasToolExecution = response.steps && response.steps.length > 1
    const hasFileList = response.text && (
      response.text.includes('.js') ||
      response.text.toLowerCase().includes('file')
    )

    if (!hasToolExecution && !hasFileList) {
      logger.warn('Expected glob tool execution with file list, but none found')
      return false
    }

    logger.success('Glob tool test passed - tool was executed and results presented')
    return true
  } catch (error) {
    logger.error('Glob tool test failed:', error)
    return false
  }
}

/**
 * Run all single tool tests
 */
export async function runAllSingleToolTests() {
  console.log('\n╔═══════════════════════════════════════════╗')
  console.log('║  Running All Single Tool Tests          ║')
  console.log('╚═══════════════════════════════════════════╝\n')

  const results = {
    bash: await testBashTool(),
    read: await testReadTool(),
    write: await testWriteTool(),
    glob: await testGlobTool(),
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Test Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const passed = Object.values(results).filter(r => r).length
  const total = Object.keys(results).length

  Object.entries(results).forEach(([name, result]) => {
    console.log(`  ${result ? '✅' : '❌'} ${name}`)
  })

  console.log(`\n  Total: ${passed}/${total} passed\n`)

  return passed === total
}
