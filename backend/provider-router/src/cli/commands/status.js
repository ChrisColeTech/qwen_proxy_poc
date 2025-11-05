/**
 * Status Command
 * Shows current active provider and its configuration
 */

import { initDatabase } from '../../database/connection.js'
import { SettingsService } from '../../database/services/settings-service.js'
import { getProvider } from '../../providers/index.js'
import { formatKeyValue, formatBox } from '../utils/table-formatter.js'
import { success, error as errorColor, bold, info } from '../utils/colors.js'
import config from '../../config.js'

export function statusCommand() {
  try {
    // Initialize database
    initDatabase()

    // Get active provider
    const activeProvider = SettingsService.getActiveProvider()
    const settingData = SettingsService.get('active_provider')
    
    // Get provider details
    let providerDetails = {}
    try {
      const provider = getProvider(activeProvider)
      const providerConfig = provider.getConfig()
      providerDetails = {
        Name: bold(activeProvider),
        Status: success('Active'),
        'Base URL': providerConfig.baseURL || 'N/A',
      }
    } catch (err) {
      providerDetails = {
        Name: bold(activeProvider),
        Status: errorColor('Not Found'),
        Error: err.message,
      }
    }

    // Add timing info if available
    if (settingData && settingData.updated_at) {
      const date = new Date(settingData.updated_at * 1000)
      providerDetails['Last Updated'] = date.toLocaleString()
    }

    // Display status
    console.log('\n' + formatBox('Provider Status', { title: 'Current Configuration' }))
    console.log('\n' + formatKeyValue(providerDetails))
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
