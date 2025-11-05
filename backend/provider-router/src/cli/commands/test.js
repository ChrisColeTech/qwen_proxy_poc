/**
 * Test Command
 * Tests provider connectivity and health
 */

import { initDatabase } from '../../database/connection.js'
import { SettingsService } from '../../database/services/settings-service.js'
import { getProvider, hasProvider } from '../../providers/index.js'
import { success, error as errorColor, bold, info, warning } from '../utils/colors.js'

export async function testCommand(providerName) {
  try {
    // Initialize database
    initDatabase()

    // Determine which provider to test
    const targetProvider = providerName || SettingsService.getActiveProvider()

    // Validate provider exists
    if (!hasProvider(targetProvider)) {
      console.error(errorColor('\nError: Provider not found: ' + targetProvider))
      process.exit(1)
    }

    console.log(info('\nTesting provider: ') + bold(targetProvider))
    console.log()

    // Get provider and test health
    const provider = getProvider(targetProvider)
    const providerConfig = provider.getConfig()
    console.log('Provider URL: ' + (providerConfig.baseURL || 'N/A'))
    console.log('Testing connection...')
    
    const startTime = Date.now()
    let healthy = false
    let errorMessage = null

    try {
      healthy = await provider.healthCheck()
    } catch (err) {
      healthy = false
      errorMessage = err.message
    }

    const duration = Date.now() - startTime

    if (healthy) {
      console.log(success('\n✓ Health check passed'))
      console.log('Response time: ' + bold(duration + 'ms'))
    } else {
      console.log(errorColor('\n✗ Health check failed'))
      if (errorMessage) {
        console.log('Error: ' + errorMessage)
      }
      console.log('Response time: ' + duration + 'ms')
    }
    console.log()

    process.exit(healthy ? 0 : 1)

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
