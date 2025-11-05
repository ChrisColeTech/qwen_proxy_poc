#!/usr/bin/env node

/**
 * Session Lifecycle Management Demo
 *
 * Demonstrates the automatic cleanup and lifecycle features
 * of the SessionManager class.
 *
 * Run: node examples/session-lifecycle-demo.js
 */

const SessionManager = require('../src/session/session-manager');

// Configuration
const DEMO_CONFIG = {
  sessionTimeout: 10 * 1000,     // 10 seconds (for demo purposes)
  cleanupInterval: 3 * 1000      // 3 seconds
};

console.log('=== Session Lifecycle Management Demo ===\n');
console.log('Configuration:');
console.log(`  Session Timeout: ${DEMO_CONFIG.sessionTimeout / 1000}s`);
console.log(`  Cleanup Interval: ${DEMO_CONFIG.cleanupInterval / 1000}s\n`);

// Create session manager
const manager = new SessionManager(DEMO_CONFIG);

// Helper to show current state
function showStatus(label) {
  const metrics = manager.getMetrics();
  console.log(`[${label}]`);
  console.log(`  Active: ${metrics.activeSessions}`);
  console.log(`  Created: ${metrics.totalCreated}`);
  console.log(`  Cleaned: ${metrics.totalCleaned}`);

  if (metrics.oldestSession) {
    console.log(`  Oldest: ${(metrics.oldestSession / 1000).toFixed(1)}s old`);
  }
  if (metrics.newestSession !== null) {
    console.log(`  Newest: ${(metrics.newestSession / 1000).toFixed(1)}s old`);
  }
  console.log('');
}

// Demonstration sequence
async function runDemo() {
  console.log('--- Step 1: Create Initial Sessions ---');
  manager.createSession('conv-session-1', 'chat-abc-123');
  manager.createSession('conv-session-2', 'chat-def-456');
  manager.createSession('conv-session-3', 'chat-ghi-789');
  showStatus('After Creation');

  console.log('--- Step 2: Wait 2 seconds ---');
  await sleep(2000);
  showStatus('After 2s');

  console.log('--- Step 3: Access Session 1 (Keep Alive) ---');
  const session1 = manager.getSession('conv-session-1');
  console.log(`  Retrieved: ${session1.chatId}\n`);
  showStatus('After Access');

  console.log('--- Step 4: Create New Session ---');
  manager.createSession('conv-session-4', 'chat-jkl-012');
  showStatus('After New Session');

  console.log('--- Step 5: Wait 5 seconds ---');
  console.log('  (sessions 2 & 3 will be inactive for 7s total)');
  console.log('  (session 1 will be inactive for 5s)');
  console.log('  (session 4 will be inactive for 5s)\n');
  await sleep(5000);
  showStatus('After 5s More');

  console.log('--- Step 6: Wait for Cleanup Cycle ---');
  console.log('  (waiting for automatic cleanup...)\n');
  await sleep(4000);
  showStatus('After Cleanup');

  console.log('--- Step 7: Get Session Info ---');
  const info1 = manager.getSessionInfo('conv-session-1');
  const info4 = manager.getSessionInfo('conv-session-4');

  if (info1) {
    console.log('  Session 1:', {
      chatId: info1.chatId,
      age: `${(info1.age / 1000).toFixed(1)}s`,
      lastAccessed: `${((Date.now() - info1.lastAccessed) / 1000).toFixed(1)}s ago`
    });
  } else {
    console.log('  Session 1: Cleaned up');
  }

  if (info4) {
    console.log('  Session 4:', {
      chatId: info4.chatId,
      age: `${(info4.age / 1000).toFixed(1)}s`,
      lastAccessed: `${((Date.now() - info4.lastAccessed) / 1000).toFixed(1)}s ago`
    });
  } else {
    console.log('  Session 4: Cleaned up');
  }
  console.log('');

  console.log('--- Step 8: Manual Cleanup ---');
  const cleaned = manager.cleanup();
  console.log(`  Manually cleaned: ${cleaned} sessions\n`);
  showStatus('After Manual Cleanup');

  console.log('--- Step 9: Final Metrics ---');
  const finalMetrics = manager.getMetrics();
  console.log('Final Statistics:');
  console.log(`  Total Sessions Created: ${finalMetrics.totalCreated}`);
  console.log(`  Total Sessions Cleaned: ${finalMetrics.totalCleaned}`);
  console.log(`  Active Sessions: ${finalMetrics.activeSessions}`);

  const retentionRate = finalMetrics.totalCreated > 0
    ? ((finalMetrics.activeSessions / finalMetrics.totalCreated) * 100).toFixed(1)
    : '0.0';
  console.log(`  Retention Rate: ${retentionRate}%`);

  const cleanupRate = finalMetrics.totalCreated > 0
    ? ((finalMetrics.totalCleaned / finalMetrics.totalCreated) * 100).toFixed(1)
    : '0.0';
  console.log(`  Cleanup Rate: ${cleanupRate}%\n`);

  console.log('--- Step 10: Shutdown ---');
  manager.shutdown();
  console.log('Session manager shut down gracefully.\n');

  console.log('=== Demo Complete ===');
  console.log('\nKey Takeaways:');
  console.log('  1. Sessions are automatically cleaned after 10s of inactivity');
  console.log('  2. Accessing a session refreshes its timeout');
  console.log('  3. Cleanup runs automatically every 3s');
  console.log('  4. Metrics track lifecycle statistics');
  console.log('  5. Graceful shutdown cleans up resources\n');
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
runDemo().catch(error => {
  console.error('Demo error:', error);
  manager.shutdown();
  process.exit(1);
});
