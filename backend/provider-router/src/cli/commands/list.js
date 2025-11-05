/**
 * List Command
 * Lists all available providers for active provider switching
 *
 * Note: This command shows providers currently loaded in the router.
 * For detailed provider management, use: provider-cli provider list
 */

import { initDatabase } from '../../database/connection.js'
import { SettingsService } from '../../database/services/settings-service.js'
import { getProviderNames, getProvider } from '../../providers/index.js'
import { formatTable } from '../utils/table-formatter.js'
import { success, error as errorColor, bold, info } from '../utils/colors.js'

export function listCommand() {
  try {
    // Initialize database
    initDatabase()

    // Get active provider
    const activeProvider = SettingsService.getActiveProvider()

    // Get all providers
    const providerNames = getProviderNames()

    const providerData = providerNames.map(name => {
      try {
        const provider = getProvider(name)
        const providerConfig = provider.getConfig()
        const isActive = name === activeProvider

        return {
          Active: isActive ? '✓' : '',
          Name: isActive ? bold(name) : name,
          'Base URL': providerConfig.baseURL || 'N/A',
        }
      } catch (err) {
        return {
          Active: '',
          Name: name,
          'Base URL': errorColor('Error: ' + err.message),
        }
      }
    })

    console.log('\n' + bold('Available Providers (for active switching):'))
    console.log(formatTable(providerData, ['Active', 'Name', 'Base URL']))
    console.log()
    console.log(info('Use "provider-cli set <name>" to switch active provider'))
    console.log(info('Use "provider-cli provider list" for detailed provider management'))
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
