const SessionManager = require('../../src/session/session-manager');

describe('SessionManager - Lifecycle Management', () => {
  let manager;

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (manager) {
      manager.shutdown();
    }
    jest.useRealTimers();
  });

  describe('constructor with options', () => {
    test('uses default timeout values when not provided', () => {
      manager = new SessionManager();

      expect(manager.sessionTimeout).toBe(30 * 60 * 1000); // 30 minutes
      expect(manager.cleanupIntervalMs).toBe(10 * 60 * 1000); // 10 minutes
    });

    test('accepts custom sessionTimeout', () => {
      manager = new SessionManager({ sessionTimeout: 5 * 60 * 1000 }); // 5 minutes

      expect(manager.sessionTimeout).toBe(5 * 60 * 1000);
    });

    test('accepts custom cleanupInterval', () => {
      manager = new SessionManager({ cleanupInterval: 2 * 60 * 1000 }); // 2 minutes

      expect(manager.cleanupIntervalMs).toBe(2 * 60 * 1000);
    });

    test('accepts both custom values', () => {
      manager = new SessionManager({
        sessionTimeout: 15 * 60 * 1000,
        cleanupInterval: 5 * 60 * 1000
      });

      expect(manager.sessionTimeout).toBe(15 * 60 * 1000);
      expect(manager.cleanupIntervalMs).toBe(5 * 60 * 1000);
    });

    test('starts cleanup interval on construction', () => {
      manager = new SessionManager();

      expect(manager.cleanupInterval).toBeDefined();
      expect(manager.cleanupInterval).not.toBe(null);
    });

    test('initializes metrics to zero', () => {
      manager = new SessionManager();

      expect(manager.totalCreated).toBe(0);
      expect(manager.totalCleaned).toBe(0);
    });
  });

  describe('automatic cleanup', () => {
    test('removes sessions inactive for longer than timeout', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000, // 5 minutes
        cleanupInterval: 1 * 60 * 1000 // 1 minute
      });

      // Create sessions
      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');

      expect(manager.getSessionCount()).toBe(2);

      // Advance time by 6 minutes (past timeout)
      jest.advanceTimersByTime(6 * 60 * 1000);

      // Trigger cleanup (runs every 1 minute)
      jest.advanceTimersByTime(1 * 60 * 1000);

      expect(manager.getSessionCount()).toBe(0);
    });

    test('preserves recently accessed sessions', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000, // 5 minutes
        cleanupInterval: 1 * 60 * 1000 // 1 minute
      });

      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');

      // Advance 3 minutes
      jest.advanceTimersByTime(3 * 60 * 1000);

      // Access conv-1 (updates lastAccessed)
      manager.getSession('conv-1');

      // Advance another 3 minutes (total 6 minutes)
      // conv-1 was accessed 3 minutes ago (within timeout)
      // conv-2 was accessed 6 minutes ago (past timeout)
      jest.advanceTimersByTime(3 * 60 * 1000);

      expect(manager.getSession('conv-1')).not.toBe(null);
      expect(manager.getSession('conv-2')).toBe(null);
    });

    test('cleanup runs automatically at configured interval', () => {
      const cleanupSpy = jest.spyOn(SessionManager.prototype, 'cleanup');

      manager = new SessionManager({
        cleanupInterval: 2 * 60 * 1000 // 2 minutes
      });

      // Cleanup shouldn't have run yet
      expect(cleanupSpy).toHaveBeenCalledTimes(0);

      // Advance by cleanup interval
      jest.advanceTimersByTime(2 * 60 * 1000);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);

      // Advance again
      jest.advanceTimersByTime(2 * 60 * 1000);
      expect(cleanupSpy).toHaveBeenCalledTimes(2);

      cleanupSpy.mockRestore();
    });

    test('cleanup returns count of cleaned sessions', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');
      manager.createSession('conv-3', 'chat-3');

      // Advance past timeout
      jest.advanceTimersByTime(6 * 60 * 1000);

      const cleanedCount = manager.cleanup();

      expect(cleanedCount).toBe(3);
      expect(manager.getSessionCount()).toBe(0);
    });

    test('cleanup returns 0 when no sessions expired', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      manager.createSession('conv-1', 'chat-1');

      // Advance but not past timeout
      jest.advanceTimersByTime(3 * 60 * 1000);

      const cleanedCount = manager.cleanup();

      expect(cleanedCount).toBe(0);
      expect(manager.getSessionCount()).toBe(1);
    });

    test('updateParentId updates lastAccessed and prevents cleanup', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      manager.createSession('conv-1', 'chat-1');

      // Advance 4 minutes
      jest.advanceTimersByTime(4 * 60 * 1000);

      // Update parent_id (refreshes lastAccessed)
      manager.updateParentId('conv-1', 'parent-123');

      // Advance 4 more minutes (total 8, but only 4 since last access)
      jest.advanceTimersByTime(4 * 60 * 1000);

      // Should still exist
      const session = manager.getSession('conv-1');
      expect(session).not.toBe(null);
      expect(session.parentId).toBe('parent-123');
    });
  });

  describe('metrics tracking', () => {
    test('tracks total sessions created', () => {
      manager = new SessionManager();

      expect(manager.totalCreated).toBe(0);

      manager.createSession('conv-1', 'chat-1');
      expect(manager.totalCreated).toBe(1);

      manager.createSession('conv-2', 'chat-2');
      expect(manager.totalCreated).toBe(2);

      manager.createSession('conv-3', 'chat-3');
      expect(manager.totalCreated).toBe(3);
    });

    test('tracks total sessions cleaned', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');

      expect(manager.totalCleaned).toBe(0);

      // Trigger automatic cleanup
      jest.advanceTimersByTime(6 * 60 * 1000);
      manager.cleanup();

      expect(manager.totalCleaned).toBe(2);
    });

    test('tracks manual deletions in totalCleaned', () => {
      manager = new SessionManager();

      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');

      expect(manager.totalCleaned).toBe(0);

      manager.deleteSession('conv-1');
      expect(manager.totalCleaned).toBe(1);

      manager.deleteSession('conv-2');
      expect(manager.totalCleaned).toBe(2);
    });

    test('getMetrics returns accurate statistics', () => {
      manager = new SessionManager();

      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');

      const metrics = manager.getMetrics();

      expect(metrics.activeSessions).toBe(2);
      expect(metrics.totalCreated).toBe(2);
      expect(metrics.totalCleaned).toBe(0);
      expect(typeof metrics.oldestSession).toBe('number');
      expect(typeof metrics.newestSession).toBe('number');
    });

    test('getMetrics shows correct counts after cleanup', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');
      manager.createSession('conv-3', 'chat-3');

      // Trigger cleanup
      jest.advanceTimersByTime(6 * 60 * 1000);
      manager.cleanup();

      const metrics = manager.getMetrics();

      expect(metrics.activeSessions).toBe(0);
      expect(metrics.totalCreated).toBe(3);
      expect(metrics.totalCleaned).toBe(3);
    });

    test('getMetrics returns null for oldest/newest when no sessions', () => {
      manager = new SessionManager();

      const metrics = manager.getMetrics();

      expect(metrics.activeSessions).toBe(0);
      expect(metrics.oldestSession).toBe(null);
      expect(metrics.newestSession).toBe(null);
    });
  });

  describe('session age tracking', () => {
    test('getOldestSessionAge returns age of oldest session', () => {
      manager = new SessionManager();

      manager.createSession('conv-1', 'chat-1');

      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

      manager.createSession('conv-2', 'chat-2');

      const oldestAge = manager.getOldestSessionAge();

      // oldest should be conv-1 at ~5 minutes
      expect(oldestAge).toBeGreaterThanOrEqual(5 * 60 * 1000);
      expect(oldestAge).toBeLessThan(6 * 60 * 1000);
    });

    test('getNewestSessionAge returns age of newest session', () => {
      manager = new SessionManager();

      manager.createSession('conv-1', 'chat-1');

      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

      manager.createSession('conv-2', 'chat-2');

      const newestAge = manager.getNewestSessionAge();

      // newest should be conv-2 at ~0 minutes
      expect(newestAge).toBeGreaterThanOrEqual(0);
      expect(newestAge).toBeLessThan(1 * 60 * 1000);
    });

    test('getOldestSessionAge returns null when no sessions', () => {
      manager = new SessionManager();

      expect(manager.getOldestSessionAge()).toBe(null);
    });

    test('getNewestSessionAge returns null when no sessions', () => {
      manager = new SessionManager();

      expect(manager.getNewestSessionAge()).toBe(null);
    });

    test('oldest and newest are same when only one session', () => {
      manager = new SessionManager();

      manager.createSession('conv-1', 'chat-1');

      jest.advanceTimersByTime(1000); // 1 second

      const oldest = manager.getOldestSessionAge();
      const newest = manager.getNewestSessionAge();

      // Should be approximately equal (within small margin)
      expect(Math.abs(oldest - newest)).toBeLessThan(100);
    });
  });

  describe('getSessionInfo', () => {
    test('returns session info with age', () => {
      manager = new SessionManager();

      manager.createSession('conv-1', 'chat-1');

      jest.advanceTimersByTime(3 * 60 * 1000); // 3 minutes

      const info = manager.getSessionInfo('conv-1');

      expect(info).not.toBe(null);
      expect(info.chatId).toBe('chat-1');
      expect(info.parentId).toBe(null);
      expect(info.age).toBeGreaterThanOrEqual(3 * 60 * 1000);
      expect(typeof info.createdAt).toBe('number');
      expect(typeof info.lastAccessed).toBe('number');
    });

    test('returns null for non-existent session', () => {
      manager = new SessionManager();

      const info = manager.getSessionInfo('non-existent');

      expect(info).toBe(null);
    });

    test('age increases over time', () => {
      manager = new SessionManager();

      manager.createSession('conv-1', 'chat-1');

      const info1 = manager.getSessionInfo('conv-1');
      const age1 = info1.age;

      jest.advanceTimersByTime(2 * 60 * 1000); // 2 minutes

      const info2 = manager.getSessionInfo('conv-1');
      const age2 = info2.age;

      expect(age2).toBeGreaterThan(age1);
      expect(age2 - age1).toBeGreaterThanOrEqual(2 * 60 * 1000);
    });
  });

  describe('manual cleanup', () => {
    test('deleteSession updates totalCleaned counter', () => {
      manager = new SessionManager();

      manager.createSession('conv-1', 'chat-1');

      expect(manager.totalCleaned).toBe(0);

      manager.deleteSession('conv-1');

      expect(manager.totalCleaned).toBe(1);
    });

    test('deleteSession logs message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      manager = new SessionManager();
      manager.createSession('conv-123', 'chat-456');

      manager.deleteSession('conv-123');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SESSION] Manually deleted session: conv-123')
      );

      consoleSpy.mockRestore();
    });

    test('deleteSession on non-existent session does not update counter', () => {
      manager = new SessionManager();

      expect(manager.totalCleaned).toBe(0);

      const result = manager.deleteSession('non-existent');

      expect(result).toBe(false);
      expect(manager.totalCleaned).toBe(0);
    });
  });

  describe('graceful shutdown', () => {
    test('shutdown clears cleanup interval', () => {
      manager = new SessionManager();

      expect(manager.cleanupInterval).not.toBe(null);

      manager.shutdown();

      expect(manager.cleanupInterval).toBe(null);
    });

    test('no cleanup runs after shutdown', () => {
      const cleanupSpy = jest.spyOn(SessionManager.prototype, 'cleanup');

      manager = new SessionManager({
        cleanupInterval: 1 * 60 * 1000
      });

      manager.shutdown();

      // Advance time past cleanup interval
      jest.advanceTimersByTime(2 * 60 * 1000);

      // Cleanup should not have been called after shutdown
      expect(cleanupSpy).toHaveBeenCalledTimes(0);

      cleanupSpy.mockRestore();
    });

    test('shutdown can be called multiple times safely', () => {
      manager = new SessionManager();

      manager.shutdown();
      manager.shutdown();
      manager.shutdown();

      expect(manager.cleanupInterval).toBe(null);
    });

    test('shutdown logs message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      manager = new SessionManager();
      manager.shutdown();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SESSION] Shutdown: Cleanup interval cleared')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('logging', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('createSession logs with session ID prefix', () => {
      manager = new SessionManager();

      manager.createSession('conv-12345678', 'chat-1');

      // Check that log was called with the expected message
      // substring(0, 8) gives us "conv-123" from "conv-12345678"
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[SESSION\] Created: conv-123.*total active: 1/)
      );
    });

    test('cleanup logs expired session details', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      manager.createSession('conv-abcd1234', 'chat-1');

      jest.advanceTimersByTime(6 * 60 * 1000);
      manager.cleanup();

      // Check that log was called with the expected message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[SESSION\] Expired: conv-abc.*inactive for \d+s/)
      );
    });

    test('cleanup logs summary when sessions cleaned', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');

      jest.advanceTimersByTime(6 * 60 * 1000);
      manager.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SESSION] Cleanup: Removed 2 expired sessions')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('(0 remaining)')
      );
    });

    test('cleanup does not log when no sessions cleaned', () => {
      consoleSpy.mockClear();

      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      manager.createSession('conv-1', 'chat-1');

      jest.advanceTimersByTime(3 * 60 * 1000); // Not past timeout
      manager.cleanup();

      // Should not log cleanup message
      const cleanupLogs = consoleSpy.mock.calls.filter(call =>
        call[0].includes('[SESSION] Cleanup:')
      );
      expect(cleanupLogs.length).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    test('long-running session lifecycle', () => {
      manager = new SessionManager({
        sessionTimeout: 10 * 60 * 1000, // 10 minutes
        cleanupInterval: 2 * 60 * 1000 // 2 minutes
      });

      // Create session
      manager.createSession('conv-1', 'chat-1');
      expect(manager.getSessionCount()).toBe(1);

      // Use session over time
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(2 * 60 * 1000); // 2 minutes
        manager.getSession('conv-1'); // Keep alive
      }

      // Session should still exist after 10 minutes of use
      expect(manager.getSessionCount()).toBe(1);

      // Stop using session
      jest.advanceTimersByTime(11 * 60 * 1000); // 11 minutes

      // Manually run cleanup
      manager.cleanup();

      // Should be cleaned up
      expect(manager.getSession('conv-1')).toBe(null);
    });

    test('multiple sessions with different access patterns', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      // Create 3 sessions
      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');
      manager.createSession('conv-3', 'chat-3');

      // Advance 3 minutes
      jest.advanceTimersByTime(3 * 60 * 1000);

      // Access conv-1 and conv-2
      manager.getSession('conv-1');
      manager.getSession('conv-2');

      // Advance 3 more minutes (total 6 minutes)
      jest.advanceTimersByTime(3 * 60 * 1000);

      // Only conv-3 should be cleaned (6 min old, not accessed)
      manager.cleanup();

      expect(manager.getSession('conv-1')).not.toBe(null);
      expect(manager.getSession('conv-2')).not.toBe(null);
      expect(manager.getSession('conv-3')).toBe(null);
    });

    test('metrics accuracy throughout lifecycle', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      // Initial state
      let metrics = manager.getMetrics();
      expect(metrics.activeSessions).toBe(0);
      expect(metrics.totalCreated).toBe(0);
      expect(metrics.totalCleaned).toBe(0);

      // Create sessions
      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');
      manager.createSession('conv-3', 'chat-3');

      metrics = manager.getMetrics();
      expect(metrics.activeSessions).toBe(3);
      expect(metrics.totalCreated).toBe(3);
      expect(metrics.totalCleaned).toBe(0);

      // Manual delete
      manager.deleteSession('conv-1');

      metrics = manager.getMetrics();
      expect(metrics.activeSessions).toBe(2);
      expect(metrics.totalCreated).toBe(3);
      expect(metrics.totalCleaned).toBe(1);

      // Automatic cleanup
      jest.advanceTimersByTime(6 * 60 * 1000);
      manager.cleanup();

      metrics = manager.getMetrics();
      expect(metrics.activeSessions).toBe(0);
      expect(metrics.totalCreated).toBe(3);
      expect(metrics.totalCleaned).toBe(3);
    });
  });

  describe('edge cases', () => {
    test('handles sessions created at exact timeout boundary', () => {
      manager = new SessionManager({
        sessionTimeout: 5 * 60 * 1000
      });

      manager.createSession('conv-1', 'chat-1');

      // Advance past timeout by 1ms
      jest.advanceTimersByTime(5 * 60 * 1000 + 1);

      manager.cleanup();

      // Should be cleaned (> timeout)
      expect(manager.getSession('conv-1')).toBe(null);
    });

    test('handles very short timeout values', () => {
      manager = new SessionManager({
        sessionTimeout: 1000 // 1 second
      });

      manager.createSession('conv-1', 'chat-1');

      jest.advanceTimersByTime(1500); // 1.5 seconds

      manager.cleanup();

      expect(manager.getSession('conv-1')).toBe(null);
    });

    test('handles very long timeout values', () => {
      manager = new SessionManager({
        sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
      });

      manager.createSession('conv-1', 'chat-1');

      jest.advanceTimersByTime(23 * 60 * 60 * 1000); // 23 hours

      manager.cleanup();

      expect(manager.getSession('conv-1')).not.toBe(null);
    });

    test('handles cleanup with no sessions', () => {
      manager = new SessionManager();

      const cleanedCount = manager.cleanup();

      expect(cleanedCount).toBe(0);
    });

    test('handles rapid session creation and cleanup', () => {
      manager = new SessionManager({
        sessionTimeout: 1000,
        cleanupInterval: 500
      });

      for (let i = 0; i < 100; i++) {
        manager.createSession(`conv-${i}`, `chat-${i}`);
      }

      expect(manager.getSessionCount()).toBe(100);

      jest.advanceTimersByTime(1500);
      manager.cleanup();

      expect(manager.getSessionCount()).toBe(0);
      expect(manager.totalCreated).toBe(100);
      expect(manager.totalCleaned).toBe(100);
    });
  });
});
