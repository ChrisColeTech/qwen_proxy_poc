/**
 * Multi-Tool Workflow Test Scenarios
 *
 * Tests complex workflows involving multiple tools to validate
 * multi-turn conversation handling and tool execution chains
 */

import { TestClient } from '../client.js'
import { logger } from '../utils/logger.js'

/**
 * Test: Glob → Read workflow
 */
export async function testGlobReadWorkflow() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Glob → Read Workflow')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()

    // Create some test files first
    logger.info('Setup: Creating test files')
    await client.sendMessage('Create files test1.txt with "File 1", test2.txt with "File 2", and test3.txt with "File 3"')

    client.clear()

    // Now test the workflow
    logger.info('Test: Find and read .txt files')
    const response = await client.sendMessage('Find all .txt files in current directory and read the first one')

    logger.info('Response received:', { text: response.text })

    // Should involve both glob and read tools
    if (!response.toolCalls || response.toolCalls.length < 2) {
      logger.warn('Expected multiple tool calls (glob + read), but got:', response.toolCalls?.length || 0)
      return false
    }

    logger.success('Glob → Read workflow test passed')
    return true
  } catch (error) {
    logger.error('Glob → Read workflow test failed:', error)
    return false
  }
}

/**
 * Test: Write → Read → Edit workflow
 */
export async function testWriteReadEditWorkflow() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Write → Read → Edit Workflow')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()

    const response = await client.sendMessage(`
      1. Create a file called workflow-test.txt with content "Original Content"
      2. Read the file to verify
      3. Change "Original" to "Modified" in the file
    `)

    logger.info('Response received:', { text: response.text })

    // Should involve write, read, and edit tools
    if (!response.toolCalls || response.toolCalls.length < 3) {
      logger.warn('Expected 3+ tool calls (write + read + edit), but got:', response.toolCalls?.length || 0)
      return false
    }

    logger.success('Write → Read → Edit workflow test passed')
    return true
  } catch (error) {
    logger.error('Write → Read → Edit workflow test failed:', error)
    return false
  }
}

/**
 * Test: Bash → Grep → Read workflow
 */
export async function testBashGrepReadWorkflow() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Bash → Grep → Read Workflow')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()

    const response = await client.sendMessage(`
      1. Create 3 test files: search1.txt with "test keyword here", search2.txt with "no match", search3.txt with "test again"
      2. Search for files containing "test"
      3. Read one of the matching files
    `)

    logger.info('Response received:', { text: response.text })

    // Should involve bash/write, grep, and read tools
    if (!response.toolCalls || response.toolCalls.length < 3) {
      logger.warn('Expected multiple tool calls, but got:', response.toolCalls?.length || 0)
      return false
    }

    logger.success('Bash → Grep → Read workflow test passed')
    return true
  } catch (error) {
    logger.error('Bash → Grep → Read workflow test failed:', error)
    return false
  }
}

/**
 * Test: Complex project creation workflow
 */
export async function testProjectCreationWorkflow() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Test: Project Creation Workflow')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    const client = new TestClient()

    const response = await client.sendMessage(`
      Create a small project structure:
      1. Create directory "myproject"
      2. Create file "myproject/main.js" with console.log("Hello World")
      3. Create file "myproject/package.json" with {"name": "myproject", "version": "1.0.0"}
      4. List the directory structure to verify
    `, { maxTurns: 15 })

    logger.info('Response received:', { text: response.text })

    // Should involve multiple bash/write commands
    if (!response.toolCalls || response.toolCalls.length < 4) {
      logger.warn('Expected 4+ tool calls for project creation, but got:', response.toolCalls?.length || 0)
      return false
    }

    logger.success('Project creation workflow test passed')
    return true
  } catch (error) {
    logger.error('Project creation workflow test failed:', error)
    return false
  }
}

/**
 * Run all multi-tool workflow tests
 */
export async function runAllMultiToolTests() {
  console.log('\n╔═══════════════════════════════════════════╗')
  console.log('║  Running All Multi-Tool Workflow Tests  ║')
  console.log('╚═══════════════════════════════════════════╝\n')

  const results = {
    globRead: await testGlobReadWorkflow(),
    writeReadEdit: await testWriteReadEditWorkflow(),
    bashGrepRead: await testBashGrepReadWorkflow(),
    projectCreation: await testProjectCreationWorkflow(),
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Multi-Tool Test Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const passed = Object.values(results).filter(r => r).length
  const total = Object.keys(results).length

  Object.entries(results).forEach(([name, result]) => {
    console.log(`  ${result ? '✅' : '❌'} ${name}`)
  })

  console.log(`\n  Total: ${passed}/${total} passed\n`)

  return passed === total
}
