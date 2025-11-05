/**
 * Provider Enable Command
 * Enables a provider
 */

import { initDatabase } from '../../../database/connection.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { success, error as errorColor, bold, warning } from '../../utils/colors.js'

export async function providerEnableCommand(id) {
  try {
    // Initialize database
    initDatabase()

    // Get provider
    const provider = ProviderService.getById(id)

    if (!provider) {
      console.error(errorColor(`\nError: Provider not found: ${id}`))
      process.exit(1)
    }

    // Check if already enabled
    if (provider.enabled) {
      console.log(warning(`\nProvider ${bold(provider.name)} is already enabled`))
      console.log()
      return
    }

    // Enable provider
    ProviderService.setEnabled(id, true)

    console.log(success('\nProvider enabled successfully!'))
    console.log(`Provider: ${bold(provider.name)} (${provider.id})`)
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
