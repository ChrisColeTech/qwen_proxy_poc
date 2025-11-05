/**
 * Test Script for Database-Backed Session Manager
 * Verifies Phase 3 implementation according to document 08
 */

import SessionManager from './src/services/session-manager.js'
import { generateMD5Hash } from './src/utils/hash-utils.js'
import { initDatabase } from './src/database/connection.js'

console.log('='.repeat(60))
console.log('Phase 3: Database-Backed Session Manager Test')
console.log('='.repeat(60))
console.log()

// Initialize database first
console.log('Initializing database...')
initDatabase()
console.log('Database initialized successfully')
console.log()

// Test configuration
const TEST_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const manager = new SessionManager({ timeout: TEST_TIMEOUT })

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (error) {
    console.error(`✗ ${name}`)
    console.error(`  Error: ${error.message}`)
    failed++
  }
}

// Test 1: Generate session ID from first message
test('Generate session ID from first user message', () => {
  const message = 'Hello, how are you?'
  const sessionId = manager.generateSessionId(message)
  const expectedHash = generateMD5Hash(message)

  if (sessionId !== expectedHash) {
    throw new Error(`Expected ${expectedHash}, got ${sessionId}`)
  }
  if (sessionId.length !== 32) {
    throw new Error(`Expected 32 character hash, got ${sessionId.length}`)
  }
})

// Test 2: Create new session
test('Create new session', () => {
  const sessionId = 'test-hash-123'
  const chatId = 'chat-456'

  const session = manager.createSession(sessionId, chatId)

  if (!session) {
    throw new Error('Session creation returned null')
  }
  if (session.sessionId !== sessionId) {
    throw new Error(`Expected sessionId ${sessionId}, got ${session.sessionId}`)
  }
  if (session.chatId !== chatId) {
    throw new Error(`Expected chatId ${chatId}, got ${session.chatId}`)
  }
  if (session.parent_id !== null) {
    throw new Error(`Expected parent_id to be null, got ${session.parent_id}`)
  }
  if (session.messageCount !== 0) {
    throw new Error(`Expected messageCount 0, got ${session.messageCount}`)
  }
})

// Test 3: Get existing session
test('Get existing session', () => {
  const sessionId = 'test-hash-123'

  const session = manager.getSession(sessionId)

  if (!session) {
    throw new Error('Session retrieval returned null')
  }
  if (session.sessionId !== sessionId) {
    throw new Error(`Expected sessionId ${sessionId}, got ${session.sessionId}`)
  }
})

// Test 4: Update parent_id
test('Update session parent_id', () => {
  const sessionId = 'test-hash-123'
  const newParentId = 'parent-789'

  const result = manager.updateParentId(sessionId, newParentId)

  if (!result) {
    throw new Error('Update returned false')
  }

  const session = manager.getSession(sessionId)
  if (session.parent_id !== newParentId) {
    throw new Error(`Expected parent_id ${newParentId}, got ${session.parent_id}`)
  }
})

// Test 5: Get parent_id
test('Get parent_id for session', () => {
  const sessionId = 'test-hash-123'
  const parentId = manager.getParentId(sessionId)

  if (parentId !== 'parent-789') {
    throw new Error(`Expected parent_id 'parent-789', got ${parentId}`)
  }
})

// Test 6: Check if session is new
test('isNewSession returns false for existing session', () => {
  const sessionId = 'test-hash-123'
  const isNew = manager.isNewSession(sessionId)

  if (isNew !== false) {
    throw new Error('Expected isNewSession to return false for existing session')
  }
})

// Test 7: Check if session is new for non-existent session
test('isNewSession returns true for non-existent session', () => {
  const sessionId = 'non-existent-session'
  const isNew = manager.isNewSession(sessionId)

  if (isNew !== true) {
    throw new Error('Expected isNewSession to return true for non-existent session')
  }
})

// Test 8: Set chat ID
test('Set chat ID for session', () => {
  const sessionId = 'test-hash-123'
  const newChatId = 'chat-updated-999'

  const result = manager.setChatId(sessionId, newChatId)

  if (!result) {
    throw new Error('setChatId returned false')
  }

  const session = manager.getSession(sessionId)
  if (session.chatId !== newChatId) {
    throw new Error(`Expected chatId ${newChatId}, got ${session.chatId}`)
  }
})

// Test 9: Get session count
test('Get session count', () => {
  const count = manager.getSessionCount()

  if (count < 1) {
    throw new Error(`Expected at least 1 session, got ${count}`)
  }
})

// Test 10: Get metrics
test('Get session metrics', () => {
  const metrics = manager.getMetrics()

  if (!metrics) {
    throw new Error('Metrics returned null')
  }
  if (typeof metrics.activeSessions !== 'number') {
    throw new Error('activeSessions is not a number')
  }
  if (typeof metrics.totalCreated !== 'number') {
    throw new Error('totalCreated is not a number')
  }
})

// Test 11: Get all active sessions
test('Get all active sessions', () => {
  const sessions = manager.getActiveSessions()

  if (!Array.isArray(sessions)) {
    throw new Error('getActiveSessions did not return an array')
  }
  if (sessions.length < 1) {
    throw new Error('Expected at least 1 active session')
  }
})

// Test 12: Get all sessions
test('Get all sessions as array', () => {
  const sessions = manager.getAllSessions()

  if (!Array.isArray(sessions)) {
    throw new Error('getAllSessions did not return an array')
  }
  if (sessions.length < 1) {
    throw new Error('Expected at least 1 session')
  }

  // Verify format [sessionId, sessionObject]
  const [sessionId, sessionObj] = sessions[0]
  if (typeof sessionId !== 'string') {
    throw new Error('Session ID is not a string')
  }
  if (!sessionObj || typeof sessionObj !== 'object') {
    throw new Error('Session object is not an object')
  }
})

// Test 13: Test session expiration (create short-lived session)
test('Session expiration handling', () => {
  const shortManager = new SessionManager({ timeout: 100 }) // 100ms timeout
  const sessionId = 'expire-test-session'

  shortManager.createSession(sessionId, 'chat-expire')

  // Wait for expiration
  const start = Date.now()
  while (Date.now() - start < 150) {
    // Wait 150ms
  }

  // Try to get expired session
  const session = shortManager.getSession(sessionId)
  if (session !== null) {
    throw new Error('Expected expired session to return null')
  }
})

// Test 14: Cleanup expired sessions
test('Cleanup expired sessions', () => {
  const shortManager = new SessionManager({ timeout: 50 })

  // Create multiple sessions
  shortManager.createSession('cleanup-test-1', 'chat-1')
  shortManager.createSession('cleanup-test-2', 'chat-2')

  // Wait for expiration
  const start = Date.now()
  while (Date.now() - start < 100) {
    // Wait 100ms
  }

  // Run cleanup
  const cleaned = shortManager.cleanup()

  if (cleaned < 2) {
    throw new Error(`Expected to clean at least 2 sessions, cleaned ${cleaned}`)
  }
})

// Test 15: Delete session
test('Delete session', () => {
  const sessionId = 'delete-test-session'
  manager.createSession(sessionId, 'chat-delete')

  const deleted = manager.deleteSession(sessionId)

  if (!deleted) {
    throw new Error('Delete returned false')
  }

  const session = manager.getSession(sessionId)
  if (session !== null) {
    throw new Error('Deleted session should return null')
  }
})

// Test 16: Cleanup timer start/stop
test('Start and stop cleanup timer', () => {
  manager.startCleanup()

  if (!manager.cleanupTimer) {
    throw new Error('Cleanup timer not started')
  }

  manager.stopCleanup()

  if (manager.cleanupTimer !== null) {
    throw new Error('Cleanup timer not stopped')
  }
})

// Test 17: Shutdown
test('Shutdown session manager', () => {
  manager.startCleanup()
  manager.shutdown()

  if (manager.cleanupTimer !== null) {
    throw new Error('Cleanup timer not stopped after shutdown')
  }
})

// Test 18: Data persistence across instances
test('Sessions persist across manager instances', () => {
  const sessionId = 'persist-test-session'
  const chatId = 'chat-persist'

  // Create session with first manager
  const manager1 = new SessionManager()
  manager1.createSession(sessionId, chatId)

  // Create new manager instance
  const manager2 = new SessionManager()
  const session = manager2.getSession(sessionId)

  if (!session) {
    throw new Error('Session did not persist across instances')
  }
  if (session.sessionId !== sessionId) {
    throw new Error('Persisted session has wrong ID')
  }
  if (session.chatId !== chatId) {
    throw new Error('Persisted session has wrong chat ID')
  }
})

// Test 19: Error handling - null session ID
test('Error handling for null session ID on create', () => {
  let errorThrown = false
  try {
    manager.createSession(null)
  } catch (error) {
    errorThrown = true
    if (!error.message.includes('Session ID is required')) {
      throw new Error('Wrong error message')
    }
  }
  if (!errorThrown) {
    throw new Error('Expected error for null session ID')
  }
})

// Test 20: Error handling - invalid message for hash generation
test('Error handling for invalid message in generateSessionId', () => {
  let errorThrown = false
  try {
    manager.generateSessionId('')
  } catch (error) {
    errorThrown = true
    if (!error.message.includes('First message must be a non-empty string')) {
      throw new Error('Wrong error message')
    }
  }
  if (!errorThrown) {
    throw new Error('Expected error for empty message')
  }
})

// Summary
console.log()
console.log('='.repeat(60))
console.log('Test Results')
console.log('='.repeat(60))
console.log(`Total Tests: ${passed + failed}`)
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log()

if (failed === 0) {
  console.log('✓ All tests passed!')
  console.log()
  console.log('Phase 3 implementation verified successfully.')
  console.log('Database-backed session manager is working correctly.')
  process.exit(0)
} else {
  console.log('✗ Some tests failed!')
  process.exit(1)
}
