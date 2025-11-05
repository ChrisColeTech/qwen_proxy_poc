/**
 * Model List Command
 * Lists all models with optional capability filtering
 */

import { initDatabase } from '../../../database/connection.js'
import { ModelService } from '../../../database/services/model-service.js'
import { ProviderModelService } from '../../../database/services/provider-model-service.js'
import { formatTable } from '../../utils/table-formatter.js'
import { success, error as errorColor, bold, info } from '../../utils/colors.js'

export async function modelListCommand(options) {
  try {
    // Initialize database
    initDatabase()

    // Get models
    let models

    if (options.capability) {
      models = ModelService.getByCapability(options.capability)
    } else {
      models = ModelService.getAll()
    }

    if (models.length === 0) {
      console.log('\n' + info('No models found'))
      console.log()
      return
    }

    // Format model data for table
    const modelData = []

    for (const model of models) {
      // Get providers for this model
      const providers = ProviderModelService.getProvidersForModel(model.id)
      const providerNames = providers.map(p => p.name).join(', ') || 'None'

      modelData.push({
        ID: model.id,
        Name: model.name,
        Capabilities: model.capabilities.join(', ') || 'N/A',
        Providers: providerNames
      })
    }

    // Display results
    const title = options.capability
      ? `Models with capability '${options.capability}' (${models.length} total):`
      : `All Models (${models.length} total):`

    console.log('\n' + bold(title))
    console.log(formatTable(modelData, ['ID', 'Name', 'Capabilities', 'Providers']))
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
