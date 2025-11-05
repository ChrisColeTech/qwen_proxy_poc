/**
 * Provider Test Connection Command
 * Tests provider connection and health
 */

import { initDatabase } from '../../../database/connection.js'
import { ProviderService } from '../../../database/services/provider-service.js'
import { ProviderFactory } from '../../../providers/provider-factory.js'
import { success, error as errorColor, bold, info, warning } from '../../utils/colors.js'

export async function providerTestCommand(id) {
  try {
    // Initialize database
    initDatabase()

    // Get provider
    const provider = ProviderService.getById(id)

    if (!provider) {
      console.error(errorColor(`\nError: Provider not found: ${id}`))
      process.exit(1)
    }

    console.log('\n' + bold(`Testing Provider: ${provider.name}`))
    console.log('===================\n')

    console.log(`ID:     ${provider.id}`)
    console.log(`Type:   ${provider.type}`)
    console.log(`Status: ${provider.enabled ? success('Enabled') : warning('Disabled')}`)
    console.log()

    // Try to create provider instance
    console.log(info('Creating provider instance...'))

    try {
      const providerInstance = await ProviderFactory.createFromDatabase(id)

      console.log(success('Provider instance created successfully'))
      console.log()

      // Test health check
      console.log(info('Running health check...'))

      const healthResult = await providerInstance.healthCheck()

      if (healthResult.healthy) {
        console.log(success('Health check passed!'))
        console.log()
        console.log('Details:')
        if (healthResult.latency !== undefined) {
          console.log(`  Latency: ${healthResult.latency}ms`)
        }
        if (healthResult.message) {
          console.log(`  Message: ${healthResult.message}`)
        }

        // Try to list models
        if (providerInstance.listModels) {
          console.log()
          console.log(info('Fetching available models...'))

          try {
            const models = await providerInstance.listModels()

            if (models && models.length > 0) {
              console.log(success(`Found ${models.length} model(s):`))
              models.slice(0, 5).forEach(model => {
                console.log(`  - ${model}`)
              })
              if (models.length > 5) {
                console.log(`  ... and ${models.length - 5} more`)
              }
            } else {
              console.log(warning('No models found'))
            }
          } catch (modelError) {
            console.log(warning('Could not fetch models: ' + modelError.message))
          }
        }

        console.log()
        console.log(success(bold('Connection test successful!')))

      } else {
        console.log(errorColor('Health check failed!'))
        console.log()
        console.log('Details:')
        if (healthResult.error) {
          console.log(`  Error: ${healthResult.error}`)
        }
        if (healthResult.message) {
          console.log(`  Message: ${healthResult.message}`)
        }
        console.log()
        console.log(errorColor(bold('Connection test failed')))
        process.exit(1)
      }

    } catch (instanceError) {
      console.log(errorColor('Failed to create provider instance'))
      console.log()
      console.log('Error: ' + instanceError.message)
      console.log()
      console.log(errorColor(bold('Connection test failed')))
      process.exit(1)
    }

    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
