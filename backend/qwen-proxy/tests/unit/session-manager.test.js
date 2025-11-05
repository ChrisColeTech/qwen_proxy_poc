const SessionManager = require('../../src/session/session-manager');

describe('SessionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  describe('createSession', () => {
    test('creates a new session with correct structure', () => {
      const conversationId = 'conv-123';
      const chatId = 'chat-456';

      const session = manager.createSession(conversationId, chatId);

      expect(session).toHaveProperty('chatId', chatId);
      expect(session).toHaveProperty('parentId', null);
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('lastAccessed');
      expect(typeof session.createdAt).toBe('number');
      expect(typeof session.lastAccessed).toBe('number');
      expect(session.createdAt).toBe(session.lastAccessed);
    });

    test('stores session and can retrieve it', () => {
      const conversationId = 'conv-123';
      const chatId = 'chat-456';

      const created = manager.createSession(conversationId, chatId);
      const retrieved = manager.getSession(conversationId);

      expect(retrieved).toEqual(created);
    });

    test('creates multiple independent sessions', () => {
      const session1 = manager.createSession('conv-1', 'chat-1');
      const session2 = manager.createSession('conv-2', 'chat-2');

      expect(session1.chatId).toBe('chat-1');
      expect(session2.chatId).toBe('chat-2');
      expect(manager.getSessionCount()).toBe(2);
    });

    test('overwrites existing session with same conversation ID', () => {
      manager.createSession('conv-123', 'chat-old');
      const newSession = manager.createSession('conv-123', 'chat-new');

      const retrieved = manager.getSession('conv-123');
      expect(retrieved.chatId).toBe('chat-new');
      expect(manager.getSessionCount()).toBe(1);
    });
  });

  describe('getSession', () => {
    test('retrieves existing session', () => {
      const conversationId = 'conv-123';
      const chatId = 'chat-456';

      manager.createSession(conversationId, chatId);
      const session = manager.getSession(conversationId);

      expect(session).toBeDefined();
      expect(session.chatId).toBe(chatId);
      expect(session.parentId).toBe(null);
    });

    test('returns null for non-existent session', () => {
      const session = manager.getSession('non-existent');

      expect(session).toBe(null);
    });

    test('updates lastAccessed timestamp when retrieving', async () => {
      const conversationId = 'conv-123';
      manager.createSession(conversationId, 'chat-456');

      const session1 = manager.getSession(conversationId);
      const firstAccessed = session1.lastAccessed;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const session2 = manager.getSession(conversationId);
      const secondAccessed = session2.lastAccessed;

      expect(secondAccessed).toBeGreaterThan(firstAccessed);
    });

    test('does not update lastAccessed for non-existent session', () => {
      const before = Date.now();
      const session = manager.getSession('non-existent');
      const after = Date.now();

      expect(session).toBe(null);
      // Should not throw or cause issues
    });
  });

  describe('updateParentId', () => {
    test('updates parent_id for existing session', () => {
      const conversationId = 'conv-123';
      manager.createSession(conversationId, 'chat-456');

      const result = manager.updateParentId(conversationId, 'parent-789');

      expect(result).toBe(true);

      const session = manager.getSession(conversationId);
      expect(session.parentId).toBe('parent-789');
    });

    test('returns false for non-existent session', () => {
      const result = manager.updateParentId('non-existent', 'parent-123');

      expect(result).toBe(false);
    });

    test('can update parent_id multiple times', () => {
      const conversationId = 'conv-123';
      manager.createSession(conversationId, 'chat-456');

      manager.updateParentId(conversationId, 'parent-1');
      expect(manager.getSession(conversationId).parentId).toBe('parent-1');

      manager.updateParentId(conversationId, 'parent-2');
      expect(manager.getSession(conversationId).parentId).toBe('parent-2');

      manager.updateParentId(conversationId, 'parent-3');
      expect(manager.getSession(conversationId).parentId).toBe('parent-3');
    });

    test('updates lastAccessed timestamp when updating parent_id', async () => {
      const conversationId = 'conv-123';
      manager.createSession(conversationId, 'chat-456');

      const session1 = manager.getSession(conversationId);
      const firstAccessed = session1.lastAccessed;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      manager.updateParentId(conversationId, 'parent-789');

      const session2 = manager.getSession(conversationId);
      const secondAccessed = session2.lastAccessed;

      expect(secondAccessed).toBeGreaterThan(firstAccessed);
    });

    test('can set parent_id to null', () => {
      const conversationId = 'conv-123';
      manager.createSession(conversationId, 'chat-456');
      manager.updateParentId(conversationId, 'parent-789');

      manager.updateParentId(conversationId, null);

      const session = manager.getSession(conversationId);
      expect(session.parentId).toBe(null);
    });
  });

  describe('deleteSession', () => {
    test('deletes existing session', () => {
      const conversationId = 'conv-123';
      manager.createSession(conversationId, 'chat-456');

      const result = manager.deleteSession(conversationId);

      expect(result).toBe(true);
      expect(manager.getSession(conversationId)).toBe(null);
      expect(manager.getSessionCount()).toBe(0);
    });

    test('returns false when deleting non-existent session', () => {
      const result = manager.deleteSession('non-existent');

      expect(result).toBe(false);
    });

    test('does not affect other sessions', () => {
      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');
      manager.createSession('conv-3', 'chat-3');

      manager.deleteSession('conv-2');

      expect(manager.getSession('conv-1')).toBeDefined();
      expect(manager.getSession('conv-2')).toBe(null);
      expect(manager.getSession('conv-3')).toBeDefined();
      expect(manager.getSessionCount()).toBe(2);
    });
  });

  describe('getAllSessions', () => {
    test('returns empty array when no sessions exist', () => {
      const sessions = manager.getAllSessions();

      expect(sessions).toEqual([]);
    });

    test('returns all sessions as array of tuples', () => {
      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');

      const sessions = manager.getAllSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions[0]).toHaveLength(2); // [conversationId, session]
      expect(sessions[1]).toHaveLength(2);

      // Find sessions by conversation ID
      const session1 = sessions.find(([id]) => id === 'conv-1');
      const session2 = sessions.find(([id]) => id === 'conv-2');

      expect(session1[1].chatId).toBe('chat-1');
      expect(session2[1].chatId).toBe('chat-2');
    });

    test('returned sessions have correct structure', () => {
      manager.createSession('conv-123', 'chat-456');

      const sessions = manager.getAllSessions();
      const [conversationId, session] = sessions[0];

      expect(conversationId).toBe('conv-123');
      expect(session).toHaveProperty('chatId', 'chat-456');
      expect(session).toHaveProperty('parentId', null);
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('lastAccessed');
    });
  });

  describe('getSessionCount', () => {
    test('returns 0 for empty manager', () => {
      expect(manager.getSessionCount()).toBe(0);
    });

    test('returns correct count after adding sessions', () => {
      manager.createSession('conv-1', 'chat-1');
      expect(manager.getSessionCount()).toBe(1);

      manager.createSession('conv-2', 'chat-2');
      expect(manager.getSessionCount()).toBe(2);

      manager.createSession('conv-3', 'chat-3');
      expect(manager.getSessionCount()).toBe(3);
    });

    test('returns correct count after deleting sessions', () => {
      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');
      manager.createSession('conv-3', 'chat-3');

      manager.deleteSession('conv-2');
      expect(manager.getSessionCount()).toBe(2);

      manager.deleteSession('conv-1');
      expect(manager.getSessionCount()).toBe(1);

      manager.deleteSession('conv-3');
      expect(manager.getSessionCount()).toBe(0);
    });
  });

  describe('clearAll', () => {
    test('removes all sessions', () => {
      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');
      manager.createSession('conv-3', 'chat-3');

      manager.clearAll();

      expect(manager.getSessionCount()).toBe(0);
      expect(manager.getAllSessions()).toEqual([]);
      expect(manager.getSession('conv-1')).toBe(null);
      expect(manager.getSession('conv-2')).toBe(null);
      expect(manager.getSession('conv-3')).toBe(null);
    });

    test('works on empty manager', () => {
      manager.clearAll();

      expect(manager.getSessionCount()).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    test('simulates multi-turn conversation flow', () => {
      const conversationId = 'conv-abc123';
      const chatId = 'qwen-chat-uuid-456';

      // Turn 1: Create new session
      const session1 = manager.createSession(conversationId, chatId);
      expect(session1.chatId).toBe(chatId);
      expect(session1.parentId).toBe(null);

      // Turn 1 response: Update parent_id with response message ID
      manager.updateParentId(conversationId, 'msg-uuid-1');

      // Turn 2: Get session
      const session2 = manager.getSession(conversationId);
      expect(session2.chatId).toBe(chatId);
      expect(session2.parentId).toBe('msg-uuid-1');

      // Turn 2 response: Update parent_id
      manager.updateParentId(conversationId, 'msg-uuid-2');

      // Turn 3: Get session
      const session3 = manager.getSession(conversationId);
      expect(session3.chatId).toBe(chatId);
      expect(session3.parentId).toBe('msg-uuid-2');

      // Verify same chat_id used throughout
      expect(session1.chatId).toBe(session2.chatId);
      expect(session2.chatId).toBe(session3.chatId);
    });

    test('handles multiple concurrent conversations', () => {
      // Conversation 1
      manager.createSession('conv-1', 'chat-1');
      manager.updateParentId('conv-1', 'parent-1-1');

      // Conversation 2
      manager.createSession('conv-2', 'chat-2');
      manager.updateParentId('conv-2', 'parent-2-1');

      // Conversation 1 continues
      manager.updateParentId('conv-1', 'parent-1-2');

      // Conversation 3 starts
      manager.createSession('conv-3', 'chat-3');

      // Conversation 2 continues
      manager.updateParentId('conv-2', 'parent-2-2');

      // Verify all conversations maintained correctly
      const session1 = manager.getSession('conv-1');
      const session2 = manager.getSession('conv-2');
      const session3 = manager.getSession('conv-3');

      expect(session1.chatId).toBe('chat-1');
      expect(session1.parentId).toBe('parent-1-2');

      expect(session2.chatId).toBe('chat-2');
      expect(session2.parentId).toBe('parent-2-2');

      expect(session3.chatId).toBe('chat-3');
      expect(session3.parentId).toBe(null);

      expect(manager.getSessionCount()).toBe(3);
    });

    test('session cleanup flow', () => {
      // Create multiple sessions
      manager.createSession('conv-1', 'chat-1');
      manager.createSession('conv-2', 'chat-2');
      manager.createSession('conv-3', 'chat-3');

      expect(manager.getSessionCount()).toBe(3);

      // Delete one specific session
      manager.deleteSession('conv-2');
      expect(manager.getSessionCount()).toBe(2);

      // Clear all remaining sessions
      manager.clearAll();
      expect(manager.getSessionCount()).toBe(0);
    });
  });

  describe('edge cases', () => {
    test('handles unusual conversation IDs', () => {
      const ids = [
        '',
        'very-long-conversation-id-'.repeat(10),
        '特殊字符',
        '123',
        'conv-with-special-chars-!@#$%'
      ];

      ids.forEach((id, index) => {
        manager.createSession(id, `chat-${index}`);
      });

      expect(manager.getSessionCount()).toBe(ids.length);

      ids.forEach((id, index) => {
        const session = manager.getSession(id);
        expect(session).toBeDefined();
        expect(session.chatId).toBe(`chat-${index}`);
      });
    });

    test('handles unusual chat IDs', () => {
      const chatIds = [
        '',
        'uuid-with-dashes',
        '12345',
        'chat_with_underscores'
      ];

      chatIds.forEach((chatId, index) => {
        manager.createSession(`conv-${index}`, chatId);
        const session = manager.getSession(`conv-${index}`);
        expect(session.chatId).toBe(chatId);
      });
    });

    test('handles unusual parent IDs', () => {
      manager.createSession('conv-123', 'chat-456');

      const parentIds = ['', null, undefined, 'parent-1', 0, false];

      parentIds.forEach(parentId => {
        manager.updateParentId('conv-123', parentId);
        const session = manager.getSession('conv-123');
        expect(session.parentId).toBe(parentId);
      });
    });
  });
});
