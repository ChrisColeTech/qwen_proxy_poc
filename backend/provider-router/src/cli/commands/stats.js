/**
 * Stats Command
 * Shows usage statistics and analytics from request logs
 */

import { initDatabase } from '../../database/connection.js'
import { LogsService } from '../../database/services/logs-service.js'
import { formatTable, formatKeyValue } from '../utils/table-formatter.js'
import { error as errorColor, bold, success, info } from '../utils/colors.js'

export function statsCommand() {
  try {
    // Initialize database
    initDatabase()

    // Get statistics
    const stats = LogsService.getStats()

    // Check if any data exists
    if (stats.total === 0) {
      console.log('\n' + info('No statistics available yet. Make some API requests first.'))
      console.log()
      return
    }

    // Display overall statistics
    console.log('\n' + bold('Usage Statistics'))
    console.log()

    // Total requests
    const totalData = {
      'Total Requests': success(stats.total.toString()),
    }
    console.log(formatKeyValue(totalData))
    console.log()

    // Provider breakdown
    if (stats.byProvider && stats.byProvider.length > 0) {
      console.log(bold('Requests by Provider:'))

      const providerData = stats.byProvider.map(row => {
        const percentage = ((row.count / stats.total) * 100).toFixed(1)
        return {
          'Provider': bold(row.provider),
          'Count': row.count.toString(),
          'Percentage': percentage + '%',
        }
      })

      console.log(formatTable(providerData, ['Provider', 'Count', 'Percentage']))
      console.log()
    }

    // Average duration by provider
    if (stats.avgDuration && stats.avgDuration.length > 0) {
      console.log(bold('Average Response Time by Provider:'))

      const durationData = stats.avgDuration.map(row => {
        const avgMs = Math.round(row.avg_ms)
        const avgSeconds = (row.avg_ms / 1000).toFixed(2)

        return {
          'Provider': bold(row.provider),
          'Avg Duration': `${avgMs}ms`,
          'Avg (seconds)': `${avgSeconds}s`,
        }
      })

      console.log(formatTable(durationData, ['Provider', 'Avg Duration', 'Avg (seconds)']))
      console.log()
    }

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
