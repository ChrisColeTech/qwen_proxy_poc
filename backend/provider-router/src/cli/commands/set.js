/**
 * Set Command
 * Sets the active provider
 */

import { initDatabase } from '../../database/connection.js'
import { SettingsService } from '../../database/services/settings-service.js'
import { getProviderNames, hasProvider } from '../../providers/index.js'
import { success, error as errorColor, bold, warning } from '../utils/colors.js'

export function setCommand(providerName) {
  try {
    // Initialize database
    initDatabase()

    // Validate provider exists
    if (!hasProvider(providerName)) {
      const availableProviders = getProviderNames()
      console.error(errorColor('\nError: Provider not found: ' + providerName))
      console.log('\nAvailable providers:')
      availableProviders.forEach(p => console.log('  - ' + p))
      console.log()
      process.exit(1)
    }

    // Get current provider
    const currentProvider = SettingsService.getActiveProvider()

    if (currentProvider === providerName) {
      console.log(warning('\nProvider is already set to: ' + bold(providerName)))
      console.log()
      return
    }

    // Set new provider
    SettingsService.setActiveProvider(providerName)

    console.log(success('\nProvider successfully changed:'))
    console.log('  From: ' + currentProvider)
    console.log('  To:   ' + bold(providerName))
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
