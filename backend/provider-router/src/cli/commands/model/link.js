/**
 * Model Link Command
 * Links a model to a provider
 */

import { initDatabase } from '../../../database/connection.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { ModelService } from '../../../database/services/model-service.js'
import { ProviderModelService } from '../../../database/services/provider-model-service.js'
import { confirm } from '../../utils/prompt.js'
import { success, error as errorColor, bold, warning } from '../../utils/colors.js'

export async function modelLinkCommand(providerId, modelId) {
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

    // Check if already linked
    if (ProviderModelService.isLinked(providerId, modelId)) {
      console.log(warning(`\nModel ${bold(model.name)} is already linked to provider ${bold(provider.name)}`))
      console.log()
      return
    }

    console.log('\n' + bold('Link Model to Provider'))
    console.log('=======================\n')

    console.log(`Provider: ${bold(provider.name)} (${provider.id})`)
    console.log(`Model:    ${bold(model.name)} (${model.id})`)
    console.log()

    // Ask if this should be the default model
    const setDefault = await confirm('Set as default model for this provider?', false)

    // Link model to provider
    ProviderModelService.link(providerId, modelId, {
      isDefault: setDefault
    })

    console.log(success('\nModel linked successfully!'))
    console.log(`Provider: ${bold(provider.name)}`)
    console.log(`Model:    ${bold(model.name)}`)

    if (setDefault) {
      console.log(`Status:   ${success('Default model')}`)
    }

    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
