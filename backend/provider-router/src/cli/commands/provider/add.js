/**
 * Provider Add Command
 * Adds a new provider interactively
 */

import { initDatabase } from '../../../database/connection.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { ProviderConfigService } from '../../../database/services/provider-config-service.js'
import { ProviderFactory } from '../../../providers/provider-factory.js'
import { PROVIDER_TYPES, PROVIDER_TYPE_METADATA } from '../../../providers/provider-types.js'
import { input, select, confirm } from '../../utils/prompt.js'
import { success, error as errorColor, bold, info, warning } from '../../utils/colors.js'

export async function providerAddCommand() {
  try {
    // Initialize database
    initDatabase()

    console.log('\n' + bold('Add New Provider'))
    console.log('================\n')

    // Select provider type
    const typeChoices = Object.values(PROVIDER_TYPES).map(type => ({
      name: PROVIDER_TYPE_METADATA[type].name,
      value: type
    }))

    const type = await select('Select provider type:', typeChoices)
    const metadata = PROVIDER_TYPE_METADATA[type]

    console.log('\n' + info(`Selected: ${metadata.name}`))
    console.log(info(`Description: ${metadata.description}`))

    // Provider ID
    const id = await input('\nProvider ID (slug)', {
      validate: (value) => {
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'ID must contain only lowercase letters, numbers, and hyphens'
        }
        if (ProviderService.exists(value)) {
          return 'Provider with this ID already exists'
        }
        return true
      }
    })

    // Provider name
    const name = await input('Provider name (display name)', {
      defaultValue: id
    })

    // Provider description
    const description = await input('Description (optional)', {
      required: false,
      defaultValue: null
    })

    // Priority
    const priorityStr = await input('Priority (higher = more priority)', {
      defaultValue: '0',
      validate: (value) => {
        const num = parseInt(value, 10)
        if (isNaN(num)) {
          return 'Priority must be a number'
        }
        return true
      }
    })
    const priority = parseInt(priorityStr, 10)

    // Collect configuration values
    console.log('\n' + bold('Provider Configuration:'))
    console.log('========================\n')

    const config = {}

    // Required config fields
    for (const field of metadata.requiredConfig) {
      const fieldSchema = metadata.configSchema[field]
      const prompt = `${field} (${fieldSchema.description})`
      const example = fieldSchema.example ? ` [e.g., ${fieldSchema.example}]` : ''

      const value = await input(prompt + example, {
        validate: (value) => {
          if (!value) {
            return `${field} is required`
          }
          if (fieldSchema.type === 'number' && isNaN(Number(value))) {
            return `${field} must be a number`
          }
          return true
        }
      })

      config[field] = fieldSchema.type === 'number' ? Number(value) : value
    }

    // Optional config fields
    const addOptional = metadata.optionalConfig.length > 0 &&
      await confirm('\nConfigure optional settings?', false)

    if (addOptional) {
      for (const field of metadata.optionalConfig) {
        const fieldSchema = metadata.configSchema[field]
        const prompt = `${field} (${fieldSchema.description})`
        const defaultVal = fieldSchema.default !== undefined ? String(fieldSchema.default) : null

        const value = await input(prompt, {
          required: false,
          defaultValue: defaultVal
        })

        if (value) {
          config[field] = fieldSchema.type === 'number' ? Number(value) : value
        }
      }
    }

    // Confirm creation
    console.log('\n' + bold('Summary:'))
    console.log(`ID:          ${id}`)
    console.log(`Name:        ${name}`)
    console.log(`Type:        ${type}`)
    console.log(`Priority:    ${priority}`)
    if (description) {
      console.log(`Description: ${description}`)
    }
    console.log('\nConfiguration:')
    Object.entries(config).forEach(([key, value]) => {
      const fieldSchema = metadata.configSchema[key]
      const displayValue = fieldSchema?.sensitive ? '***MASKED***' : value
      console.log(`  ${key}: ${displayValue}`)
    })

    const confirmed = await confirm('\nCreate this provider?', true)

    if (!confirmed) {
      console.log(warning('\nProvider creation cancelled'))
      console.log()
      return
    }

    // Create provider
    const provider = ProviderService.create(id, name, type, {
      enabled: true,
      priority,
      description
    })

    // Save configuration
    for (const [key, value] of Object.entries(config)) {
      const fieldSchema = metadata.configSchema[key]
      const isSensitive = fieldSchema?.sensitive || false
      ProviderConfigService.set(id, key, value, isSensitive)
    }

    console.log(success('\nProvider created successfully!'))
    console.log(`ID:   ${bold(provider.id)}`)
    console.log(`Name: ${bold(provider.name)}`)
    console.log()

    // Ask if they want to enable it now
    const enableNow = await confirm('Enable this provider now?', true)

    if (enableNow) {
      ProviderService.setEnabled(id, true)
      console.log(success('Provider enabled'))
      console.log()
    }

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
