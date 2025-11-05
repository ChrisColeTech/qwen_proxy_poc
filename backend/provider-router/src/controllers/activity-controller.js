/**
 * Activity Controller
 * Handles activity logs and statistics endpoints
 */

import { LogsService } from '../database/services/logs-service.js'
import RequestRepository from '../database/repositories/request-repository.js'
import ResponseRepository from '../database/repositories/response-repository.js'
import SessionRepository from '../database/repositories/session-repository.js'
import { getDatabase } from '../database/connection.js'
import { getAllProviders } from '../providers/index.js'

const requestRepo = new RequestRepository()
const responseRepo = new ResponseRepository()
const sessionRepo = new SessionRepository()

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
function getRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`
  } else if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  } else if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  } else {
    return days === 1 ? '1 day ago' : `${days} days ago`
  }
}

/**
 * GET /api/v1/activity/recent
 * Get recent activity from requests/responses tables
 */
export async function getRecentActivity(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20

    // Get recent logs from database
    const logs = LogsService.getRecent(limit)

    // Transform to activity feed format
    const activities = logs.map(log => {
      const isError = log.error !== null && log.error !== undefined
      const action = isError ? 'failed' : 'completed'

      // Build description
      let description = `API request to ${log.endpoint}`
      if (log.request_body && log.request_body.model) {
        description += ` (model: ${log.request_body.model})`
      }

      // Build metadata
      const metadata = {
        method: log.method,
        path: log.endpoint,
        status: isError ? 'error' : 'success',
        duration_ms: log.duration_ms || null,
        session_id: log.session_id,
        request_id: log.request_id
      }

      if (isError) {
        metadata.error = log.error
      }

      if (log.finish_reason) {
        metadata.finish_reason = log.finish_reason
      }

      return {
        id: log.request_id || log.id,
        type: 'api_request',
        action,
        description,
        timestamp: getRelativeTime(log.timestamp || log.created_at),
        timestamp_ms: log.timestamp || log.created_at,
        metadata
      }
    })

    res.json({
      activities,
      total: activities.length,
      limit
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/activity/stats
 * Get aggregated statistics
 */
export async function getActivityStats(req, res, next) {
  try {
    const db = getDatabase()

    // Get total API requests
    const totalRequestsQuery = db.prepare('SELECT COUNT(*) as count FROM requests')
    const totalRequests = totalRequestsQuery.get().count

    // Get average response time
    const avgResponseTimeQuery = db.prepare(`
      SELECT AVG(duration_ms) as avg_ms
      FROM responses
      WHERE duration_ms IS NOT NULL
    `)
    const avgResponseTimeResult = avgResponseTimeQuery.get()
    const avgResponseTime = avgResponseTimeResult && avgResponseTimeResult.avg_ms
      ? Math.round(avgResponseTimeResult.avg_ms)
      : 0

    // Get active sessions count (not expired)
    const now = Date.now()
    const activeSessionsQuery = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expires_at > ?')
    const activeSessions = activeSessionsQuery.get(now).count

    // Get recent error count (last 24 hours)
    const oneDayAgo = now - (24 * 60 * 60 * 1000)
    const recentErrorsQuery = db.prepare(`
      SELECT COUNT(*) as count
      FROM responses
      WHERE error IS NOT NULL
      AND timestamp >= ?
    `)
    const recentErrors = recentErrorsQuery.get(oneDayAgo).count

    // Get total providers count
    const providers = getAllProviders()
    const totalProviders = providers.length

    // Get total models count from database
    const totalModelsQuery = db.prepare('SELECT COUNT(*) as count FROM models')
    const totalModels = totalModelsQuery.get().count

    // Get request counts by time period
    const oneHourAgo = now - (60 * 60 * 1000)
    const requestsLastHourQuery = db.prepare(`
      SELECT COUNT(*) as count
      FROM requests
      WHERE timestamp >= ?
    `)
    const requestsLastHour = requestsLastHourQuery.get(oneHourAgo).count

    const requestsLastDayQuery = db.prepare(`
      SELECT COUNT(*) as count
      FROM requests
      WHERE timestamp >= ?
    `)
    const requestsLastDay = requestsLastDayQuery.get(oneDayAgo).count

    // Get success rate (last 24 hours)
    const totalLastDayQuery = db.prepare(`
      SELECT COUNT(*) as count
      FROM requests
      WHERE timestamp >= ?
    `)
    const totalLastDay = totalLastDayQuery.get(oneDayAgo).count

    const successLastDayQuery = db.prepare(`
      SELECT COUNT(*) as count
      FROM responses
      WHERE error IS NULL
      AND timestamp >= ?
    `)
    const successLastDay = successLastDayQuery.get(oneDayAgo).count

    const successRate = totalLastDay > 0
      ? Math.round((successLastDay / totalLastDay) * 100)
      : 100

    res.json({
      stats: {
        total_api_requests: totalRequests,
        avg_response_time_ms: avgResponseTime,
        active_sessions: activeSessions,
        recent_errors: recentErrors,
        total_providers: totalProviders,
        total_models: totalModels,
        requests_last_hour: requestsLastHour,
        requests_last_day: requestsLastDay,
        success_rate_percent: successRate
      }
    })
  } catch (error) {
    next(error)
  }
}

export default {
  getRecentActivity,
  getActivityStats
}
