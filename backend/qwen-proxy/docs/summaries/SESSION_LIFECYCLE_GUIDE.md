# Session Lifecycle Management Guide

## Quick Start

The SessionManager now includes automatic cleanup and lifecycle management to prevent memory leaks in production.

### Basic Usage (Default Settings)

```javascript
const SessionManager = require('./src/session/session-manager');

// Create with default settings (30 min timeout, 10 min cleanup)
const sessionManager = new SessionManager();

// Sessions are automatically cleaned up after 30 minutes of inactivity
// Cleanup runs every 10 minutes
```

### Custom Configuration

```javascript
// Production: Longer timeouts
const sessionManager = new SessionManager({
  sessionTimeout: 60 * 60 * 1000,   // 1 hour
  cleanupInterval: 15 * 60 * 1000   // 15 minutes
});

// Development: Shorter timeouts for testing
const sessionManager = new SessionManager({
  sessionTimeout: 5 * 60 * 1000,    // 5 minutes
  cleanupInterval: 1 * 60 * 1000    // 1 minute
});
```

## Core Features

### 1. Automatic Cleanup

Sessions that haven't been accessed for longer than `sessionTimeout` are automatically removed.

```javascript
// Create a session
sessionManager.createSession('conv-123', 'chat-456');
// [SESSION] Created: conv-123 (total active: 1)

// ... 30+ minutes pass without accessing the session ...

// Cleanup runs automatically
// [SESSION] Expired: conv-123 (inactive for 1850s)
// [SESSION] Cleanup: Removed 1 expired sessions (0 remaining)
```

### 2. Session Access Updates Timeout

Every time you access or update a session, its `lastAccessed` timestamp is updated, preventing cleanup:

```javascript
// These operations refresh the session timeout:
sessionManager.getSession('conv-123');           // Refreshes timeout
sessionManager.updateParentId('conv-123', '..'); // Refreshes timeout
```

### 3. Manual Cleanup

You can manually trigger cleanup at any time:

```javascript
const cleanedCount = sessionManager.cleanup();
console.log(`Cleaned ${cleanedCount} sessions`);
```

### 4. Session Metrics

Get real-time statistics about session lifecycle:

```javascript
const metrics = sessionManager.getMetrics();

console.log(`Active sessions: ${metrics.activeSessions}`);
console.log(`Total created: ${metrics.totalCreated}`);
console.log(`Total cleaned: ${metrics.totalCleaned}`);
console.log(`Oldest session: ${(metrics.oldestSession / 1000 / 60).toFixed(1)} minutes old`);
console.log(`Newest session: ${(metrics.newestSession / 1000).toFixed(1)} seconds old`);
```

**Example Output:**
```
Active sessions: 12
Total created: 150
Total cleaned: 138
Oldest session: 28.5 minutes old
Newest session: 5.2 seconds old
```

### 5. Session Information

Get detailed information about a specific session:

```javascript
const info = sessionManager.getSessionInfo('conv-123');

if (info) {
  console.log(`Chat ID: ${info.chatId}`);
  console.log(`Parent ID: ${info.parentId}`);
  console.log(`Created: ${new Date(info.createdAt).toISOString()}`);
  console.log(`Last Accessed: ${new Date(info.lastAccessed).toISOString()}`);
  console.log(`Age: ${(info.age / 1000 / 60).toFixed(1)} minutes`);
}
```

### 6. Graceful Shutdown

Always call `shutdown()` when stopping your application:

```javascript
// In your server shutdown handler
process.on('SIGTERM', () => {
  sessionManager.shutdown();
  // [SESSION] Shutdown: Cleanup interval cleared

  // ... close server, etc ...
  process.exit(0);
});
```

**Note:** This is already implemented in `src/server.js` lines 102-128.

## Monitoring Best Practices

### 1. Health Check Integration

Add session metrics to your health endpoint:

```javascript
app.get('/health', (req, res) => {
  const metrics = sessionManager.getMetrics();

  res.json({
    status: 'ok',
    sessions: {
      active: metrics.activeSessions,
      total_created: metrics.totalCreated,
      total_cleaned: metrics.totalCleaned,
      oldest_age_minutes: Math.round(metrics.oldestSession / 1000 / 60),
      newest_age_seconds: Math.round(metrics.newestSession / 1000)
    }
  });
});
```

### 2. Periodic Metrics Logging

Log session metrics periodically to track trends:

```javascript
setInterval(() => {
  const metrics = sessionManager.getMetrics();
  console.log('[METRICS] Session stats:', {
    active: metrics.activeSessions,
    created: metrics.totalCreated,
    cleaned: metrics.totalCleaned,
    retention_rate: ((metrics.activeSessions / metrics.totalCreated) * 100).toFixed(1) + '%'
  });
}, 5 * 60 * 1000); // Every 5 minutes
```

### 3. Alerting Thresholds

Set up alerts for unusual session behavior:

```javascript
const metrics = sessionManager.getMetrics();

// Alert if too many active sessions (possible memory leak)
if (metrics.activeSessions > 1000) {
  console.error('[ALERT] High active session count:', metrics.activeSessions);
}

// Alert if oldest session is very old (cleanup not working?)
if (metrics.oldestSession > 2 * 60 * 60 * 1000) { // 2 hours
  console.warn('[ALERT] Very old session detected:',
    Math.round(metrics.oldestSession / 1000 / 60), 'minutes');
}

// Alert if cleanup rate is too high (sessions churning?)
const cleanupRate = metrics.totalCleaned / metrics.totalCreated;
if (cleanupRate > 0.9) {
  console.warn('[ALERT] High session cleanup rate:',
    (cleanupRate * 100).toFixed(1) + '%');
}
```

## Troubleshooting

### Sessions Not Being Cleaned Up

**Symptoms:**
- Active session count keeps growing
- Memory usage increasing over time
- No cleanup log messages

**Possible Causes:**

1. **Sessions are being accessed frequently**
   - Check if sessions are legitimately active
   - Review access patterns in your logs

2. **Cleanup interval too long**
   - Reduce `cleanupInterval` value
   - Default is 10 minutes

3. **Cleanup interval not running**
   - Check if `shutdown()` was called accidentally
   - Verify Node.js event loop is not blocked

**Solution:**
```javascript
// Manually trigger cleanup to test
const cleaned = sessionManager.cleanup();
console.log('Cleaned:', cleaned);

// Check metrics
const metrics = sessionManager.getMetrics();
console.log('Metrics:', metrics);
```

### Memory Still Growing

**Symptoms:**
- Cleanup is working but memory still increases
- Active sessions are low but memory high

**Possible Causes:**
- Other memory leaks unrelated to sessions
- Session data objects growing over time
- Parent_id chain accumulating data

**Diagnosis:**
```javascript
// Check session sizes
const sessions = sessionManager.getAllSessions();
sessions.forEach(([id, session]) => {
  console.log(`Session ${id}:`, JSON.stringify(session).length, 'bytes');
});
```

### Cleanup Too Aggressive

**Symptoms:**
- Users losing session state
- Too many "session not found" errors
- High cleanup rate

**Solution:**
```javascript
// Increase session timeout
const sessionManager = new SessionManager({
  sessionTimeout: 60 * 60 * 1000,  // Increase to 1 hour
  cleanupInterval: 10 * 60 * 1000
});
```

## Configuration Recommendations

### Development Environment
```javascript
{
  sessionTimeout: 5 * 60 * 1000,    // 5 minutes
  cleanupInterval: 1 * 60 * 1000    // 1 minute (quick testing)
}
```

### Production Environment
```javascript
{
  sessionTimeout: 30 * 60 * 1000,   // 30 minutes (default)
  cleanupInterval: 10 * 60 * 1000   // 10 minutes (default)
}
```

### High-Traffic Production
```javascript
{
  sessionTimeout: 15 * 60 * 1000,   // 15 minutes (shorter for memory)
  cleanupInterval: 5 * 60 * 1000    // 5 minutes (more frequent)
}
```

### Long-Running Conversations
```javascript
{
  sessionTimeout: 120 * 60 * 1000,  // 2 hours
  cleanupInterval: 30 * 60 * 1000   // 30 minutes
}
```

## Testing Lifecycle Management

### Unit Testing with Fake Timers

```javascript
const SessionManager = require('./src/session/session-manager');

describe('Session Lifecycle', () => {
  let manager;

  beforeEach(() => {
    jest.useFakeTimers();
    manager = new SessionManager({
      sessionTimeout: 5 * 60 * 1000,
      cleanupInterval: 1 * 60 * 1000
    });
  });

  afterEach(() => {
    manager.shutdown();
    jest.useRealTimers();
  });

  test('cleans up after timeout', () => {
    manager.createSession('test-1', 'chat-1');

    // Advance time past timeout
    jest.advanceTimersByTime(6 * 60 * 1000);

    // Trigger cleanup
    manager.cleanup();

    expect(manager.getSession('test-1')).toBe(null);
  });
});
```

### Integration Testing

```javascript
// Test with real timeouts (use shorter values)
const manager = new SessionManager({
  sessionTimeout: 1000,      // 1 second
  cleanupInterval: 500       // 500ms
});

setTimeout(() => {
  const metrics = manager.getMetrics();
  console.log('After 2 seconds:', metrics);
  manager.shutdown();
}, 2000);
```

## Log Messages Reference

### Session Created
```
[SESSION] Created: conv-1234 (total active: 5)
```
- `conv-1234`: First 8 characters of conversation ID
- `5`: Current number of active sessions

### Session Expired
```
[SESSION] Expired: conv-5678 (inactive for 1850s)
```
- `conv-5678`: First 8 characters of conversation ID
- `1850s`: Time since last access in seconds

### Cleanup Summary
```
[SESSION] Cleanup: Removed 3 expired sessions (12 remaining)
```
- `3`: Number of sessions cleaned in this run
- `12`: Number of active sessions remaining

### Manual Delete
```
[SESSION] Manually deleted session: conv-abcd
```
- Logged when `deleteSession()` is called explicitly

### Shutdown
```
[SESSION] Shutdown: Cleanup interval cleared
```
- Logged when `shutdown()` is called
- Indicates graceful cleanup of interval

## API Reference

### Constructor
```javascript
new SessionManager(options)
```
- `options.sessionTimeout`: Time in ms before session expires (default: 1800000 = 30min)
- `options.cleanupInterval`: Time in ms between cleanup runs (default: 600000 = 10min)

### Methods

#### `cleanup()`
Manually trigger cleanup of expired sessions.
- **Returns:** `number` - Count of sessions cleaned
- **Side Effects:** Deletes expired sessions, logs cleanup

#### `getMetrics()`
Get session lifecycle statistics.
- **Returns:** `Object` with keys:
  - `activeSessions`: Current session count
  - `totalCreated`: Total sessions created since start
  - `totalCleaned`: Total sessions cleaned (manual + automatic)
  - `oldestSession`: Age of oldest session in ms (null if none)
  - `newestSession`: Age of newest session in ms (null if none)

#### `getSessionInfo(conversationId)`
Get detailed info about a session.
- **Parameters:** `conversationId` - Session identifier
- **Returns:** `Object` or `null`
  - `chatId`: Qwen chat ID
  - `parentId`: Current parent message ID
  - `createdAt`: Creation timestamp
  - `lastAccessed`: Last access timestamp
  - `age`: Time since creation in ms

#### `getOldestSessionAge()`
Get age of oldest session.
- **Returns:** `number` (ms) or `null` if no sessions

#### `getNewestSessionAge()`
Get age of newest session.
- **Returns:** `number` (ms) or `null` if no sessions

#### `shutdown()`
Stop cleanup interval for graceful shutdown.
- **Returns:** `void`
- **Side Effects:** Clears cleanup interval, logs shutdown

## Performance Characteristics

- **Memory:** O(n) where n = number of active sessions
- **Cleanup Time:** O(n) linear scan of all sessions
- **Session Access:** O(1) constant time via Map
- **Cleanup Impact:** ~1ms per 100 sessions

## Migration from Previous Version

If you have existing code using SessionManager without lifecycle management:

### No Changes Required!
The API is fully backward compatible. Simply update your code and sessions will start being cleaned up automatically.

### Optional: Configure Timeouts
```javascript
// Old code (still works)
const manager = new SessionManager();

// New code (with custom timeouts)
const manager = new SessionManager({
  sessionTimeout: 60 * 60 * 1000,
  cleanupInterval: 15 * 60 * 1000
});
```

### Optional: Add Shutdown Handler
```javascript
process.on('SIGTERM', () => {
  sessionManager.shutdown();
  // ... rest of shutdown logic
});
```

## See Also

- `PHASE_8_SUMMARY.md` - Complete implementation details
- `tests/unit/session-lifecycle.test.js` - 45 test examples
- `src/server.js` - Graceful shutdown example (lines 102-128)
