/**
 * Provider List Command
 * Lists all providers with filtering options
 */

import { initDatabase } from '../../../database/connection.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { ProviderConfigService } from '../../../database/services/provider-config-service.js'
import { formatTable } from '../../utils/table-formatter.js'
import { success, error as errorColor, bold, info, colors } from '../../utils/colors.js'

export async function providerListCommand(options) {
  try {
    // Initialize database
    initDatabase()

    // Build filters from options
    const filters = {}

    if (options.type) {
      filters.type = options.type
    }

    if (options.enabled) {
      filters.enabled = true
    }

    // Get providers
    const providers = ProviderService.getAll(filters)

    if (providers.length === 0) {
      console.log('\n' + info('No providers found'))
      console.log()
      return
    }

    // Format provider data for table
    const providerData = providers.map(provider => {
      const config = ProviderConfigService.getAll(provider.id, true)
      const baseURL = config.baseURL || 'N/A'

      return {
        ID: provider.id,
        Name: provider.name,
        Type: provider.type,
        Status: provider.enabled ? success('Enabled') : errorColor('Disabled'),
        Priority: provider.priority,
        'Base URL': baseURL
      }
    })

    // Display results
    console.log('\n' + bold(`Providers (${providers.length} total):`))
    console.log(formatTable(providerData, ['ID', 'Name', 'Type', 'Status', 'Priority', 'Base URL']))
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
