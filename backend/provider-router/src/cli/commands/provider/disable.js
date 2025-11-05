/**
 * Provider Disable Command
 * Disables a provider
 */

import { initDatabase } from '../../../database/connection.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { success, error as errorColor, bold, warning } from '../../utils/colors.js'

export async function providerDisableCommand(id) {
  try {
    // Initialize database
    initDatabase()

    // Get provider
    const provider = ProviderService.getById(id)

    if (!provider) {
      console.error(errorColor(`\nError: Provider not found: ${id}`))
      process.exit(1)
    }

    // Check if already disabled
    if (!provider.enabled) {
      console.log(warning(`\nProvider ${bold(provider.name)} is already disabled`))
      console.log()
      return
    }

    // Disable provider
    ProviderService.setEnabled(id, false)

    console.log(success('\nProvider disabled successfully!'))
    console.log(`Provider: ${bold(provider.name)} (${provider.id})`)
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
