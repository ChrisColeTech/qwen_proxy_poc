/**
 * Example: Using the Database-Backed Session Manager
 * Demonstrates common usage patterns for Phase 3 implementation
 */

import SessionManager from './src/services/session-manager.js'
import { initDatabase } from './src/database/connection.js'

// Initialize database (required before using session manager)
console.log('Initializing database...')
initDatabase()

// Create session manager instance
const sessionManager = new SessionManager({
  timeout: 30 * 60 * 1000,      // 30 minutes
  cleanupInterval: 10 * 60 * 1000  // Cleanup every 10 minutes
})

console.log('\n=== Session Manager Usage Examples ===\n')

// Example 1: Create a new session
console.log('1. Creating a new session:')
const firstMessage = 'Hello, how can you help me today?'
const sessionId = sessionManager.generateSessionId(firstMessage)
console.log(`   Generated session ID: ${sessionId}`)

const session = sessionManager.createSession(sessionId, 'chat-12345')
console.log(`   Created session:`, session)

// Example 2: Get existing session
console.log('\n2. Retrieving existing session:')
const retrievedSession = sessionManager.getSession(sessionId)
console.log(`   Retrieved session:`, retrievedSession)

// Example 3: Update parent_id after getting response
console.log('\n3. Updating parent_id after response:')
const newParentId = 'msg-response-001'
sessionManager.updateParentId(sessionId, newParentId)
console.log(`   Updated parent_id to: ${newParentId}`)

const updatedSession = sessionManager.getSession(sessionId)
console.log(`   Session now has parent_id: ${updatedSession.parent_id}`)

// Example 4: Get parent_id for next message
console.log('\n4. Getting parent_id for next message:')
const parentId = sessionManager.getParentId(sessionId)
console.log(`   Parent ID for next message: ${parentId}`)

// Example 5: Check if session is new
console.log('\n5. Checking if session is new:')
const isNew1 = sessionManager.isNewSession(sessionId)
console.log(`   Is "${sessionId}" new? ${isNew1}`)

const isNew2 = sessionManager.isNewSession('non-existent-session')
console.log(`   Is "non-existent-session" new? ${isNew2}`)

// Example 6: Get session metrics
console.log('\n6. Getting session metrics:')
const metrics = sessionManager.getMetrics()
console.log(`   Active sessions: ${metrics.activeSessions}`)
console.log(`   Total sessions: ${metrics.totalCreated}`)

// Example 7: Start automatic cleanup
console.log('\n7. Starting automatic cleanup:')
sessionManager.startCleanup()
console.log('   Automatic cleanup started (runs every 10 minutes)')

// Example 8: Create multiple sessions
console.log('\n8. Creating multiple sessions:')
const messages = [
  'What is the weather today?',
  'Tell me a joke',
  'Explain quantum physics'
]

messages.forEach((msg, index) => {
  const sid = sessionManager.generateSessionId(msg)
  sessionManager.createSession(sid, `chat-${1000 + index}`)
  console.log(`   Created session ${index + 1}: ${sid.substring(0, 8)}...`)
})

// Example 9: List all sessions
console.log('\n9. Listing all sessions:')
const allSessions = sessionManager.getAllSessions()
console.log(`   Total sessions: ${allSessions.length}`)
allSessions.forEach(([sid, data], index) => {
  console.log(`   ${index + 1}. ${sid.substring(0, 8)}... - Chat: ${data.chatId}`)
})

// Example 10: Session expiration demo
console.log('\n10. Testing session expiration:')
const shortManager = new SessionManager({ timeout: 2000 }) // 2 seconds
const expireTestId = shortManager.generateSessionId('This will expire soon')
shortManager.createSession(expireTestId, 'chat-expire')
console.log(`   Created session with 2-second timeout: ${expireTestId.substring(0, 8)}...`)

// Wait 3 seconds
console.log('   Waiting 3 seconds for expiration...')
await new Promise(resolve => setTimeout(resolve, 3000))

const expiredSession = shortManager.getSession(expireTestId)
console.log(`   Session after expiration: ${expiredSession}`)

// Example 11: Manual cleanup
console.log('\n11. Running manual cleanup:')
const cleaned = sessionManager.cleanup()
console.log(`   Cleaned up ${cleaned} expired sessions`)

// Example 12: Data persistence demonstration
console.log('\n12. Demonstrating data persistence:')
const persistTestId = sessionManager.generateSessionId('Persistence test message')
sessionManager.createSession(persistTestId, 'chat-persist-001')
console.log(`   Created session in manager 1: ${persistTestId.substring(0, 8)}...`)

// Create new manager instance (simulates server restart)
const newManager = new SessionManager()
const persistedSession = newManager.getSession(persistTestId)
console.log(`   Retrieved from manager 2: ${persistedSession ? 'SUCCESS' : 'FAILED'}`)
console.log(`   Chat ID preserved: ${persistedSession.chatId}`)

// Example 13: Graceful shutdown
console.log('\n13. Graceful shutdown:')
sessionManager.shutdown()
console.log('   Session manager shutdown complete')
console.log('   (Sessions remain in database for next startup)')

console.log('\n=== All Examples Complete ===\n')

// Cleanup: Stop the short manager
shortManager.shutdown()
