/**
 * Provider Remove Command
 * Removes a provider with confirmation
 */

import { initDatabase } from '../../../database/connection.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { ProviderModelService } from '../../../database/services/provider-model-service.js'
import { confirm } from '../../utils/prompt.js'
import { success, error as errorColor, bold, warning } from '../../utils/colors.js'

export async function providerRemoveCommand(id) {
  try {
    // Initialize database
    initDatabase()

    // Get provider
    const provider = ProviderService.getById(id)

    if (!provider) {
      console.error(errorColor(`\nError: Provider not found: ${id}`))
      process.exit(1)
    }

    console.log('\n' + warning(bold('Remove Provider')))
    console.log('===============\n')

    console.log('Provider to remove:')
    console.log(`  ID:   ${bold(provider.id)}`)
    console.log(`  Name: ${bold(provider.name)}`)
    console.log(`  Type: ${provider.type}`)
    console.log()

    // Check if provider has models
    const models = ProviderModelService.getModelsForProvider(id)

    if (models.length > 0) {
      console.log(warning(`This provider has ${models.length} linked model(s):`))
      models.forEach(model => {
        console.log(`  - ${model.name} (${model.id})`)
      })
      console.log()
      console.log(warning('Removing this provider will also unlink all models.'))
      console.log()
    }

    // Confirm removal
    const confirmed = await confirm(
      warning('Are you sure you want to remove this provider? This cannot be undone.'),
      false
    )

    if (!confirmed) {
      console.log(info('\nProvider removal cancelled'))
      console.log()
      return
    }

    // Delete provider (cascade will delete configs and model links)
    ProviderService.delete(id)

    console.log(success('\nProvider removed successfully!'))
    console.log(`Removed: ${bold(provider.name)} (${provider.id})`)
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
