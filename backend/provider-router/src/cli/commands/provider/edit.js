/**
 * Provider Edit Command
 * Edits provider configuration
 */

import { initDatabase } from '../../../database/connection.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { ProviderConfigService } from '../../../database/services/provider-config-service.js'
import { PROVIDER_TYPE_METADATA } from '../../../providers/provider-types.js'
import { input, confirm, select } from '../../utils/prompt.js'
import { success, error as errorColor, bold, info } from '../../utils/colors.js'

export async function providerEditCommand(id) {
  try {
    // Initialize database
    initDatabase()

    // Get provider
    const provider = ProviderService.getById(id)

    if (!provider) {
      console.error(errorColor(`\nError: Provider not found: ${id}`))
      process.exit(1)
    }

    console.log('\n' + bold(`Edit Provider: ${provider.name}`))
    console.log('=================\n')

    // Show current configuration
    const currentConfig = ProviderConfigService.getAll(id, false)

    console.log(info('Current Configuration:'))
    console.log(`ID:          ${provider.id}`)
    console.log(`Name:        ${provider.name}`)
    console.log(`Type:        ${provider.type}`)
    console.log(`Status:      ${provider.enabled ? 'Enabled' : 'Disabled'}`)
    console.log(`Priority:    ${provider.priority}`)
    console.log(`Description: ${provider.description || 'N/A'}`)
    console.log()

    const metadata = PROVIDER_TYPE_METADATA[provider.type]
    if (metadata) {
      console.log('Configuration values:')
      for (const [key, value] of Object.entries(currentConfig)) {
        console.log(`  ${key}: ${value}`)
      }
      console.log()
    }

    // What to edit?
    const editChoices = [
      { name: 'Basic information (name, description, priority)', value: 'basic' },
      { name: 'Configuration values', value: 'config' },
      { name: 'Both', value: 'both' }
    ]

    const editChoice = await select('What would you like to edit?', editChoices)

    const updates = {}

    // Edit basic information
    if (editChoice === 'basic' || editChoice === 'both') {
      console.log('\n' + bold('Basic Information:'))

      const newName = await input('Name', {
        defaultValue: provider.name
      })
      if (newName !== provider.name) {
        updates.name = newName
      }

      const newDescription = await input('Description', {
        required: false,
        defaultValue: provider.description || ''
      })
      if (newDescription !== (provider.description || '')) {
        updates.description = newDescription || null
      }

      const newPriorityStr = await input('Priority', {
        defaultValue: String(provider.priority),
        validate: (value) => {
          const num = parseInt(value, 10)
          if (isNaN(num)) {
            return 'Priority must be a number'
          }
          return true
        }
      })
      const newPriority = parseInt(newPriorityStr, 10)
      if (newPriority !== provider.priority) {
        updates.priority = newPriority
      }
    }

    // Edit configuration
    if (editChoice === 'config' || editChoice === 'both') {
      console.log('\n' + bold('Configuration Values:'))

      if (!metadata) {
        console.log(errorColor('Cannot edit config: Unknown provider type'))
      } else {
        // Let user select which config to edit
        const configKeys = Object.keys(currentConfig)
        const configChoices = configKeys.map(key => ({
          name: `${key}: ${currentConfig[key]}`,
          value: key
        }))
        configChoices.push({ name: 'Done editing', value: null })

        let keepEditing = true
        while (keepEditing) {
          console.log()
          const keyToEdit = await select('Select configuration to edit:', configChoices)

          if (!keyToEdit) {
            keepEditing = false
            break
          }

          const fieldSchema = metadata.configSchema[keyToEdit]
          const currentValue = currentConfig[keyToEdit]

          const newValue = await input(`New value for ${keyToEdit}`, {
            defaultValue: String(currentValue),
            validate: (value) => {
              if (fieldSchema?.type === 'number' && isNaN(Number(value))) {
                return `${keyToEdit} must be a number`
              }
              return true
            }
          })

          if (newValue !== String(currentValue)) {
            const finalValue = fieldSchema?.type === 'number' ? Number(newValue) : newValue
            const isSensitive = fieldSchema?.sensitive || false
            ProviderConfigService.set(id, keyToEdit, finalValue, isSensitive)
            console.log(success(`Updated ${keyToEdit}`))

            // Update display
            currentConfig[keyToEdit] = newValue
            configChoices.find(c => c.value === keyToEdit).name = `${keyToEdit}: ${newValue}`
          }
        }
      }
    }

    // Apply basic updates
    if (Object.keys(updates).length > 0) {
      ProviderService.update(id, updates)
      console.log(success('\nProvider updated successfully!'))
    } else if (editChoice !== 'config') {
      console.log(info('\nNo changes made'))
    } else {
      console.log(success('\nProvider configuration updated successfully!'))
    }

    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
