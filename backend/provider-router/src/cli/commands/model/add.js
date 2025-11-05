/**
 * Model Add Command
 * Adds a new model interactively
 */

import { initDatabase } from '../../../database/connection.js'
import { ModelService } from '../../../database/services/model-service.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { ProviderModelService } from '../../../database/services/provider-model-service.js'
import { input, confirm } from '../../utils/prompt.js'
import { success, error as errorColor, bold, info, warning } from '../../utils/colors.js'

export async function modelAddCommand() {
  try {
    // Initialize database
    initDatabase()

    console.log('\n' + bold('Add New Model'))
    console.log('==============\n')

    // Model ID
    const id = await input('Model ID', {
      validate: (value) => {
        if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
          return 'ID must contain only letters, numbers, hyphens, and underscores'
        }
        if (ModelService.exists(value)) {
          return 'Model with this ID already exists'
        }
        return true
      }
    })

    // Model name
    const name = await input('Model name (display name)', {
      defaultValue: id
    })

    // Model description
    const description = await input('Description (optional)', {
      required: false,
      defaultValue: null
    })

    // Capabilities
    console.log('\n' + info('Capabilities (comma-separated, e.g., chat,streaming,tools):'))
    const capabilitiesStr = await input('Capabilities', {
      defaultValue: 'chat',
      required: false
    })

    const capabilities = capabilitiesStr
      ? capabilitiesStr.split(',').map(c => c.trim()).filter(c => c)
      : []

    // Confirm creation
    console.log('\n' + bold('Summary:'))
    console.log(`ID:           ${id}`)
    console.log(`Name:         ${name}`)
    console.log(`Description:  ${description || 'N/A'}`)
    console.log(`Capabilities: ${capabilities.join(', ') || 'None'}`)

    const confirmed = await confirm('\nCreate this model?', true)

    if (!confirmed) {
      console.log(warning('\nModel creation cancelled'))
      console.log()
      return
    }

    // Create model
    const model = ModelService.create(id, name, {
      description,
      capabilities
    })

    console.log(success('\nModel created successfully!'))
    console.log(`ID:   ${bold(model.id)}`)
    console.log(`Name: ${bold(model.name)}`)
    console.log()

    // Ask if they want to link to a provider now
    const linkNow = await confirm('Link this model to a provider now?', false)

    if (linkNow) {
      const providers = ProviderService.getAll()

      if (providers.length === 0) {
        console.log(warning('No providers available to link to'))
        console.log()
        return
      }

      console.log('\nAvailable providers:')
      providers.forEach((p, index) => {
        console.log(`  ${index + 1}. ${p.name} (${p.id}) - ${p.type}`)
      })

      const providerIndexStr = await input('\nEnter provider number', {
        validate: (value) => {
          const num = parseInt(value, 10)
          if (isNaN(num) || num < 1 || num > providers.length) {
            return 'Invalid provider number'
          }
          return true
        }
      })

      const providerIndex = parseInt(providerIndexStr, 10) - 1
      const selectedProvider = providers[providerIndex]

      const setDefault = await confirm('Set as default model for this provider?', false)

      ProviderModelService.link(selectedProvider.id, id, {
        isDefault: setDefault
      })

      console.log(success(`\nModel linked to provider ${bold(selectedProvider.name)}`))
      console.log()
    }

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
