#!/usr/bin/env node

/**
 * Basic Test Script
 * Tests the TestClient with a simple message
 */

import { TestClient } from './src/client.js'
import { logger } from './src/utils/logger.js'

async function test() {
  console.log('=== Basic Test Client Test ===\n')

  try {
    // Create client
    const client = new TestClient()
    logger.info('Client created')

    // Send a simple message that should trigger a tool call
    logger.info('Sending test message...')
    const response = await client.sendMessage('List files in the current directory')

    // Display result
    console.log('\n=== Response ===')
    console.log(response.text)
    console.log('\n=== Conversation Summary ===')
    console.log(client.getSummary())

    logger.info('Test completed successfully!')
  } catch (error) {
    logger.error('Test failed', error)
    process.exit(1)
  }
}

test()
