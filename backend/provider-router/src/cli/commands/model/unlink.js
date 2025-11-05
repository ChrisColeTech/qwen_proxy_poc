/**
 * Model Unlink Command
 * Unlinks a model from a provider
 */

import { initDatabase } from '../../../database/connection.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { ModelService } from '../../../database/services/model-service.js'
import { ProviderModelService } from '../../../database/services/provider-model-service.js'
import { confirm } from '../../utils/prompt.js'
import { success, error as errorColor, bold, warning, info } from '../../utils/colors.js'

export async function modelUnlinkCommand(providerId, modelId) {
  try {
    // Initialize database
    initDatabase()

    // Validate provider exists
    const provider = ProviderService.getById(providerId)
    if (!provider) {
      console.error(errorColor(`\nError: Provider not found: ${providerId}`))
      process.exit(1)
    }

    // Validate model exists
    const model = ModelService.getById(modelId)
    if (!model) {
      console.error(errorColor(`\nError: Model not found: ${modelId}`))
      process.exit(1)
    }

    // Check if linked
    if (!ProviderModelService.isLinked(providerId, modelId)) {
      console.log(warning(`\nModel ${bold(model.name)} is not linked to provider ${bold(provider.name)}`))
      console.log()
      return
    }

    console.log('\n' + bold('Unlink Model from Provider'))
    console.log('===========================\n')

    console.log(`Provider: ${bold(provider.name)} (${provider.id})`)
    console.log(`Model:    ${bold(model.name)} (${model.id})`)
    console.log()

    // Check if this is the default model
    const link = ProviderModelService.getLink(providerId, modelId)
    if (link && link.is_default) {
      console.log(warning('This is the default model for this provider.'))
      console.log()
    }

    // Confirm unlinking
    const confirmed = await confirm('Unlink this model from the provider?', true)

    if (!confirmed) {
      console.log(info('\nModel unlinking cancelled'))
      console.log()
      return
    }

    // Unlink model from provider
    ProviderModelService.unlink(providerId, modelId)

    console.log(success('\nModel unlinked successfully!'))
    console.log(`Provider: ${bold(provider.name)}`)
    console.log(`Model:    ${bold(model.name)}`)
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
